import {verifyBot,SecurityCheckError} from '@/lib/server/bot-check';
import {limitedForm} from '@/lib/server/upload';
import {deliverySchema,deliveryDetails} from '@/lib/delivery';
import { NextRequest,NextResponse } from 'next/server';
import {randomBytes,createHash} from 'node:crypto';
import { z } from 'zod';
import {parishes,jamaicanPhone} from '@/lib/commerce';
import {catalog,db,rateLimit,consumeBotToken,rateLimitIdentity,settings,publicSettings} from '@/lib/server/store';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({
 name:z.string().trim().min(2).max(100), email:z.string().trim().email().max(150),
 phone:z.string().trim().max(30).refine(x=>Boolean(jamaicanPhone(x))), parish:z.enum(parishes),
 address:z.string().trim().min(5).max(240), fulfillment:z.enum(['pickup','delivery']), shipping:deliverySchema,
 notes:z.string().max(600).optional(), consent:z.literal(true),
 website:z.string().max(80).optional(),
 paymentMethod:z.literal('bank_transfer'),
 lines:z.array(z.object({productId:z.string(),variantId:z.string(),quantity:z.number().int().min(1).max(20)})).min(1).max(30)
});
function failure(message:string,status=400){return NextResponse.json({ok:false,message},{status,headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 try{
  await rateLimit(req);
  const form=await limitedForm(req,32000);
  const payload=form.get('order');if(typeof payload!=='string'||payload.length>18000)return failure('Invalid order request.');
  let obj:unknown;try{obj=JSON.parse(payload);}catch{return failure('Invalid order data.');}
  const parsed=schema.safeParse(obj);if(!parsed.success)return failure('Please check the required fields and selected payment method.');
  await verifyBot(form.get('botToken'),'invoice');
 await consumeBotToken(String(form.get('botToken')));
  const x=parsed.data;if(x.website)return failure('Unable to process request.');
  await rateLimitIdentity('invoice-email',x.email);
  await rateLimitIdentity('invoice-phone',jamaicanPhone(x.phone)!);
  const config=await settings();
  let shipping;try{shipping=deliveryDetails(x.shipping,x.parish,config.delivery_fee_jmd);}catch(e){return failure(e instanceof Error?e.message:'Invalid delivery selection.');}
  if(config.store_paused||!config.delivery_enabled)return failure('Ordering or delivery is temporarily paused.',503);
  if(!config.available_parishes.includes(x.parish))return failure('Delivery is not available in the selected parish.');
  if(x.paymentMethod==='bank_transfer'&&!(config.bank_enabled&&config.bank_account&&config.bank_name))return failure('Bank transfer is not currently available.');

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
  if(unpriced)return failure('A product still needs a confirmed price. Contact Cardone’s before generating an invoice or paying.');
  const reference=`CAR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${randomBytes(5).toString('hex').toUpperCase()}`;
  const token=randomBytes(32).toString('hex');
  const status='awaiting_payment';
  const res=await sb.from('store_orders').insert({
   reference,invoice_upload_hash:createHash('sha256').update(token).digest('hex'),billing_address:x.address,customer_name:x.name,email:x.email||null,phone:jamaicanPhone(x.phone),parish:x.parish,address:shipping.destination,
   fulfillment:'delivery',shipping_service:shipping.service,shipping_town:shipping.town||null,shipping_destination:shipping.destination,courier_fee_collect:shipping.courierCollect,notes:x.notes||null,lines,priced_subtotal_jmd:subtotal,
   has_unpriced:unpriced,status,delivery_fee_jmd:shipping.fee,payment_method:x.paymentMethod,receipt_path:null
  });
  if(res.error)return failure('Unable to generate the invoice. Please contact Cardone’s.',503);
  const publicConfig=publicSettings(config);
  return NextResponse.json({ok:true,reference,token,issuedAt:new Date().toISOString(),customer:{name:x.name,email:x.email,phone:jamaicanPhone(x.phone),address:x.address,parish:x.parish},bank:publicConfig.payment.bank,pricedSubtotalJmd:subtotal,lines,deliveryFeeJmd:shipping.fee,shipping,message:'Invoice generated. Transfer the amount using this reference, then upload proof and submit your order.'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){
  if(e instanceof SecurityCheckError)return failure(e.message,400);
  const msg=e instanceof Error?e.message:'';
  if(msg.startsWith('Too many'))return failure(msg,429);
  return failure('Ordering is not yet configured or temporarily unavailable.',503);
 }
}