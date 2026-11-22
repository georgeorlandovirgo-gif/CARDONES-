import {deliverySchema,deliveryDetails} from '@/lib/delivery';
import { NextRequest,NextResponse } from 'next/server';
import {randomBytes} from 'node:crypto';
import { z } from 'zod';
import {parishes,jamaicanPhone} from '@/lib/commerce';
import {catalog,db,rateLimit,settings,publicSettings} from '@/lib/server/store';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({
 name:z.string().trim().min(2).max(100), email:z.union([z.string().email().max(150),z.literal('')]).optional(),
 phone:z.string().trim().max(30).refine(x=>Boolean(jamaicanPhone(x))), parish:z.enum(parishes),
 address:z.string().max(240).optional(), fulfillment:z.enum(['pickup','delivery']), shipping:deliverySchema,
 notes:z.string().max(600).optional(), consent:z.literal(true),
 website:z.string().max(80).optional(),
 paymentMethod:z.enum(['bank_transfer','cash','whatsapp','quote_request']),
 lines:z.array(z.object({productId:z.string(),variantId:z.string(),quantity:z.number().int().min(1).max(20)})).min(1).max(30)
});
function failure(message:string,status=400){return NextResponse.json({ok:false,message},{status,headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 try{
  if(!req.headers.get('content-type')?.includes('multipart/form-data'))return failure('Send the checkout form as multipart data.',415);
  if(Number(req.headers.get('content-length')||0)>5*1024*1024+50000)return failure('Request too large.',413);
  const form=await req.formData();
  const payload=form.get('order');if(typeof payload!=='string'||payload.length>18000)return failure('Invalid order request.');
  let obj:unknown;try{obj=JSON.parse(payload);}catch{return failure('Invalid order data.');}
  const parsed=schema.safeParse(obj);if(!parsed.success)return failure('Please check the required fields and selected payment method.');
  const x=parsed.data;if(x.website)return failure('Unable to process request.');
  const config=await settings();
  let shipping;try{shipping=deliveryDetails(x.shipping,x.parish,config.delivery_fee_jmd);}catch(e){return failure(e instanceof Error?e.message:'Invalid delivery selection.');}
  if(config.store_paused||!config.delivery_enabled)return failure('Ordering or delivery is temporarily paused.',503);
  if(!config.available_parishes.includes(x.parish))return failure('Delivery is not available in the selected parish.');
  if(x.paymentMethod==='cash')return failure('Products must be paid for before dispatch. Courier COD applies only to the courier charge.');
  if(x.paymentMethod==='bank_transfer'&&!(config.bank_enabled&&config.bank_account&&config.bank_name))return failure('Bank transfer is not currently available.');
  if(x.paymentMethod==='whatsapp'&&!(config.whatsapp_enabled&&config.whatsapp))return failure('WhatsApp checkout is not currently available.');
  await rateLimit(req);
  const all=await catalog();let subtotal=0,unpriced=false;
  const seen=new Set<string>();
  const sb=db();
  const lines=[] as Array<{productId:string;name:string;variantId:string;size:string;quantity:number;unitPriceJmd:number|null}>;
  for(const line of x.lines){
   const key=`${line.productId}:${line.variantId}`;if(seen.has(key))return failure('Duplicate items in your bag.');seen.add(key);
   const product=all.find(p=>p.id===line.productId);
   const variant=product?.variants.find(v=>v.id===line.variantId);
   if(!product||!variant||!variant.available)return failure('A selected item is not currently available.');
   if(variant.priceJmd===null)unpriced=true;else subtotal+=variant.priceJmd*line.quantity;
   const stock=await sb.from('store_variants').select('stock_count').eq('id',variant.id).single();
   if(stock.error)return failure('Unable to verify stock. Please try again.',503);
   if(stock.data?.stock_count!==null&&stock.data?.stock_count!==undefined&&stock.data.stock_count<line.quantity)return failure(`Insufficient inventory for ${product.name}.`);
   lines.push({productId:product.id,name:product.name,variantId:variant.id,size:variant.label,quantity:line.quantity,unitPriceJmd:variant.priceJmd});
  }
  if(unpriced&&x.paymentMethod!=='quote_request'&&x.paymentMethod!=='whatsapp')return failure('Unpriced items require a quotation before payment.');
  if(!unpriced&&x.paymentMethod==='quote_request')return failure('Please choose an available payment method.');
  let receipt:Buffer|undefined,mime:string|undefined;
  const file=form.get('receipt');
  if(file instanceof File&&file.size>0){
   if(x.paymentMethod!=='bank_transfer')return failure('Receipts are only accepted for bank-transfer orders.');
   if(file.size>5*1024*1024)return failure('Receipt must be smaller than 5 MB.');
   receipt=Buffer.from(await file.arrayBuffer());
   const jpeg=receipt.subarray(0,3).equals(Buffer.from([255,216,255]));
   const png=receipt.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
   const webp=receipt.toString('ascii',0,4)==='RIFF'&&receipt.toString('ascii',8,12)==='WEBP';
   const pdf=receipt.toString('ascii',0,5)==='%PDF-';
   if(!(jpeg||png||webp||pdf))return failure('Use a valid JPG, PNG, WebP, or PDF receipt.');
   mime=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':'application/pdf';
  }
  const reference=`CAR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomBytes(5).toString('hex').toUpperCase()}`;
  let receiptPath:string|null=null;
  if(receipt&&mime){
   const ext=mime==='application/pdf'?'pdf':mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
   receiptPath=`${reference}/${randomBytes(8).toString('hex')}.${ext}`;
   const {error}=await sb.storage.from('cardones-receipts').upload(receiptPath,receipt,{contentType:mime,upsert:false});
   if(error)return failure('Receipt could not be safely stored. Please try without a receipt.',503);
  }
  const status=x.paymentMethod==='bank_transfer'?(receiptPath?'payment_submitted':'awaiting_payment'):
   'new_request';
  const res=await sb.from('store_orders').insert({
   reference,customer_name:x.name,email:x.email||null,phone:jamaicanPhone(x.phone),parish:x.parish,address:shipping.destination,
   fulfillment:'delivery',shipping_service:shipping.service,shipping_town:shipping.town||null,shipping_destination:shipping.destination,courier_fee_collect:shipping.courierCollect,notes:x.notes||null,lines,priced_subtotal_jmd:subtotal,
   has_unpriced:unpriced,status,delivery_fee_jmd:shipping.fee,payment_method:x.paymentMethod,receipt_path:receiptPath
  });
  if(res.error){if(receiptPath)await sb.storage.from('cardones-receipts').remove([receiptPath]);return failure('Unable to record the order. Please contact the store.',503);}
  // Optional email notification: order has already been persisted.
  if(process.env.RESEND_API_KEY&&process.env.ORDER_NOTIFICATION_EMAIL&&process.env.ORDER_FROM_EMAIL){
   try{await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(4500),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({from:process.env.ORDER_FROM_EMAIL,to:[process.env.ORDER_NOTIFICATION_EMAIL],
     subject:`Cardone's ${reference}`,text:`Reference: ${reference}\nMethod: ${x.paymentMethod}\nStatus: ${status}\nName: ${x.name}\nPhone: ${x.phone}\nParish: ${x.parish}\n${lines.map(l=>`${l.quantity} x ${l.name} ${l.size}`).join('\n')}\nSubtotal: J$${subtotal}\nUnpriced: ${unpriced}`})});}catch{/* Persistence remains authoritative */}
  }
  const publicConfig=publicSettings(config);
  const message=lines.map(l=>`${l.quantity} x ${l.name} (${l.size})`).join('; ');
  const whatsappUrl=x.paymentMethod==='whatsapp'&&publicConfig.whatsapp?
   `https://wa.me/${publicConfig.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Cardone's order ${reference}\n${message}\nPriced subtotal J$${subtotal}\n${x.fulfillment} in ${x.parish}. Please confirm.`)}`:null;
  return NextResponse.json({ok:true,reference,quoted:unpriced,pricedSubtotalJmd:subtotal,lines,deliveryFeeJmd:shipping.fee,shipping,fulfillment:'delivery',paymentMethod:x.paymentMethod,whatsappUrl,
   message:'Your request has been recorded. Dispatch is Wednesday or Saturday only, after payment has been verified.'},
   {status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){
  const msg=e instanceof Error?e.message:'';
  if(msg.startsWith('Too many'))return failure(msg,429);
  return failure('Ordering is not yet configured or temporarily unavailable.',503);
 }
}