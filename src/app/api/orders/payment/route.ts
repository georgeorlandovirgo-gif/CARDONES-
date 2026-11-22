import {NextRequest,NextResponse} from 'next/server';
import {createHash,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {db,rateLimit} from '@/lib/server/store';
import {limitedForm,proofType} from '@/lib/server/upload';
export const runtime='nodejs';export const dynamic='force-dynamic';
const schema=z.object({reference:z.string().regex(/^CAR-\d{8}-[A-F0-9]{10}$/),token:z.string().regex(/^[a-f0-9]{64}$/),transferReference:z.string().trim().min(2).max(100)});
export async function POST(req:NextRequest){const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{'Cache-Control':'no-store'}});let uploaded:string|null=null;try{
 await rateLimit(req,'payment-proof');const form=await limitedForm(req,5*1024*1024+16000);const parsed=schema.safeParse({reference:form.get('reference'),token:form.get('token'),transferReference:form.get('transferReference')});if(!parsed.success)return reply({message:'Check your invoice access and bank transfer reference.'},400);
 const x=parsed.data,hash=createHash('sha256').update(x.token).digest('hex'),sb=db();const {data:order,error}=await sb.from('store_orders').select('status,submitted_at').eq('reference',x.reference).eq('invoice_upload_hash',hash).single();if(error||!order)return reply({message:'Invoice access is invalid.'},403);if(order.submitted_at)return reply({ok:true,reference:x.reference,message:'This order has already been submitted for payment review.'});if(order.status!=='awaiting_payment')return reply({message:'Contact Cardone’s to update this invoice.'},409);
 const file=form.get('receipt');if(!(file instanceof File)||file.size===0||file.size>5*1024*1024)return reply({message:'Attach proof of payment, no larger than 5 MB.'},400);const bytes=Buffer.from(await file.arrayBuffer());let type;try{type=proofType(bytes);}catch(e){return reply({message:(e as Error).message},400);}
 const path=`${x.reference}/${randomBytes(16).toString('hex')}.${type.ext}`;const result=await sb.storage.from('cardones-receipts').upload(path,bytes,{contentType:type.mime,upsert:false});if(result.error)throw Error('Storage unavailable');uploaded=path;
 const saved=await sb.rpc('submit_cardones_invoice',{p_reference:x.reference,p_hash:hash,p_receipt:path,p_transfer:x.transferReference});if(saved.error)throw Error('Submission unavailable');if(saved.data===false)await sb.storage.from('cardones-receipts').remove([path]);uploaded=null;
 // Notify only after the proof and order submission are durably saved.
 if(saved.data===true&&process.env.RESEND_API_KEY&&process.env.ORDER_NOTIFICATION_EMAIL&&process.env.ORDER_FROM_EMAIL){
  try{await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(4500),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.ORDER_FROM_EMAIL,to:[process.env.ORDER_NOTIFICATION_EMAIL],subject:`Cardone's order submitted: ${x.reference}`,text:`Invoice ${x.reference} has been submitted with proof of bank transfer. Sign in to your owner dashboard to review the private proof and independently verify the funds before processing.`})});}catch{/* The persisted submission remains authoritative. */}
 }
 return reply({ok:true,reference:x.reference,message:'Order submitted for processing. Your transfer is awaiting independent verification by Cardone’s.'});
 }catch(e){if(uploaded)try{await db().storage.from('cardones-receipts').remove([uploaded]);}catch{}const message=e instanceof Error?e.message:'';return reply({message:message.startsWith('Too many')?message:'Unable to submit proof. Your invoice remains unpaid; please retry or contact Cardone’s with its reference.'},message.startsWith('Too many')?429:503);}}
