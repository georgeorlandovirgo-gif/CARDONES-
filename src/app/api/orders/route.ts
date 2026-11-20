import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { loadCatalog, loadSettings, serviceDatabase } from "@/lib/server/database";

export const runtime="nodejs";
const schema=z.object({
 name:z.string().trim().min(2).max(100),
 email:z.union([z.string().trim().email().max(150),z.literal("")]).optional(),
 phone:z.string().trim().min(7).max(30).refine(n=>/^(1)?(876|658)[0-9]{7}$/.test(n.replace(/[^0-9]/g,"")), "Enter a valid Jamaican 876 or 658 telephone number."),
 parish:z.string().trim().min(2).max(65),
 address:z.string().trim().max(240).optional(),
 fulfillment:z.enum(["pickup","delivery"]),
 paymentMethod:z.enum(["to_confirm","bank_transfer","cash_on_delivery","whatsapp"]),
 notes:z.string().trim().max(600).optional(),
 consent:z.literal(true),
 website:z.string().max(80).optional(),
 lines:z.array(z.object({productId:z.string(),variantId:z.string(),quantity:z.number().int().min(1).max(20)})).min(1).max(30)
});
const fail=(message:string,status=400)=>NextResponse.json({ok:false,message},{status,headers:{"Cache-Control":"no-store"}});
export async function POST(req:NextRequest){
 if(process.env.NEXT_PUBLIC_STORE_DEMO==="1")return fail("Preview mode never accepts orders.",403);
 const db=serviceDatabase();
 if(!db)return fail("Order services are not yet configured.",503);
 if(Number(req.headers.get("content-length")||0)>20000)return fail("Request too large.",413);
 if(!req.headers.get("content-type")?.includes("application/json"))return fail("JSON is required.",415);
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return fail(parsed.error.issues[0]?.message||"Check your contact details and order selection.");
 const info=parsed.data;
 if(info.website)return fail("Order could not be processed.");
 // Require merchant launch readiness before collecting ANY customer personal information.
 const settings=await loadSettings();
 if(!settings.store_open)return fail("Cardone’s is not yet accepting online orders.",503);
 if(info.fulfillment==="pickup"&&!settings.pickup_enabled)return fail("Pickup is not available.");
 if(info.fulfillment==="delivery"&&!settings.delivery_enabled)return fail("Delivery is not available.");
 if(info.paymentMethod==="bank_transfer"&&!settings.bank_enabled)return fail("Bank transfer is not enabled.");
 if(info.paymentMethod==="cash_on_delivery"&&!settings.cod_enabled)return fail("Cash on delivery is not enabled.");
 if(info.paymentMethod==="whatsapp"&&!settings.whatsapp_enabled)return fail("WhatsApp ordering is not enabled.");
 // Production uses Turnstile when configured. The SQL slot limiter still applies.
 if(process.env.TURNSTILE_SECRET_KEY){
   const token=req.headers.get("x-turnstile-token")||"";
   if(!token)return fail("Please complete the anti-spam verification.");
   const verify=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
     method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
     body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token})
   }).then(r=>r.json()).catch(()=>({success:false}));
   if(!verify.success)return fail("The verification was not successful.");
 }
 let catalog;
 try{catalog=await loadCatalog(true);}catch{return fail("Product inventory is currently unavailable. Please contact the store.",503);}
 const seen=new Set<string>();
 let subtotal=0,hasUnpriced=false;
 const lines: Array<{productId:string;name:string;variantId:string;size:string;quantity:number;unitPriceJmd:number|null}>=[];
 for(const item of info.lines){
   const key=item.productId+":"+item.variantId;
   if(seen.has(key))return fail("Duplicate products in the bag.");
   seen.add(key);
   const product=catalog.find(p=>p.id===item.productId);
   const variant=product?.variants.find(v=>v.id===item.variantId);
   if(!product||!variant||!variant.available)return fail("One of your selected products is not currently available.");
   if(variant.priceJmd===null)hasUnpriced=true;
   else subtotal+=variant.priceJmd*item.quantity;
   lines.push({productId:product.id,name:product.name,variantId:variant.id,size:variant.label,quantity:item.quantity,unitPriceJmd:variant.priceJmd});
 }
 if(hasUnpriced && !["to_confirm","whatsapp"].includes(info.paymentMethod)) return fail("Unpriced items must be confirmed before choosing a payment method.");
 const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"unknown";
 const fingerprint=createHash("sha256").update(ip+"|"+info.phone+"|"+(process.env.ORDER_RATE_SALT||"cardones-order-rate")).digest("hex");
 const limiter=await db.rpc("take_store_order_slot",{p_hash:fingerprint});
 if(limiter.error)return fail("Order protection is not yet configured. Please contact the store.",503);
 if(limiter.data!==true)return fail("Too many requests. Please try again later.",429);
 const token=randomBytes(28).toString("hex");
 const ref="CAR-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+randomBytes(4).toString("hex").toUpperCase();
 const paymentStatus=info.paymentMethod==="bank_transfer"?"unpaid":info.paymentMethod==="cash_on_delivery"?"not_required":"unpaid";
 const status=info.paymentMethod==="bank_transfer"?"awaiting_payment":"new_request";
 const deliveryFee=info.fulfillment==="delivery"?settings.delivery_fee_jmd:null;
 const {error}=await db.from("store_orders").insert({
  reference:ref,customer_name:info.name,email:info.email||null,phone:info.phone,
  parish:info.parish,address:info.address||null,fulfillment:info.fulfillment,
  notes:info.notes||null,lines,priced_subtotal_jmd:subtotal,has_unpriced:hasUnpriced,
  payment_method:info.paymentMethod,payment_status:paymentStatus,status,
  delivery_fee_jmd:deliveryFee,
  receipt_token_hash:info.paymentMethod==="bank_transfer"?createHash("sha256").update(token).digest("hex"):null
 });
 if(error){console.error("Order save failure",error.code);return fail("The order request could not be saved.",503);}
 // Optional merchant notification: an SMTP failure does not invalidate a saved order.
 const resendKey=process.env.RESEND_API_KEY,merchant=process.env.ORDER_NOTIFICATION_EMAIL,sender=process.env.ORDER_FROM_EMAIL;
 if(resendKey&&merchant&&sender) {
  const text=lines.map(x=>x.quantity+" × "+x.name+" / "+x.size+" — "+(x.unitPriceJmd===null?"Price on request":"J$"+x.unitPriceJmd)).join("\n");
  try{
   const response=await fetch("https://api.resend.com/emails",{
    method:"POST",signal:AbortSignal.timeout(5000),
    headers:{Authorization:"Bearer "+resendKey,"Content-Type":"application/json"},
    body:JSON.stringify({from:sender,to:[merchant],subject:"Cardone’s order request "+ref,text:"Reference: "+ref+"\nCustomer: "+info.name+"\nPhone: "+info.phone+"\nParish: "+info.parish+"\nPayment method: "+info.paymentMethod+"\n\n"+text})
   });
   if(!response.ok)console.error("Notification provider status",response.status);
  }catch{console.error("Order notification could not be delivered.");}
 }
 return NextResponse.json({ok:true,reference:ref,quoted:hasUnpriced,
  subtotalJmd:subtotal,deliveryFeeJmd:deliveryFee,
  receiptToken:info.paymentMethod==="bank_transfer"?token:null,
  message:"Request saved. The merchant must confirm availability and payment before fulfilment."
 },{status:201,headers:{"Cache-Control":"no-store"}});
}
