import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, owner, settings, toPhone } from '@/lib/server/store';
import {createClient} from '@supabase/supabase-js';
import {parishes} from '@/lib/commerce';
import { products } from '@/lib/catalog';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const err=(message:string,status=400)=>NextResponse.json({error:message},{status,headers:{'Cache-Control':'no-store'}});
const nullable=z.string().trim().max(600).nullable().optional();
const merchantSchema=z.object({
 phone:nullable,whatsapp:nullable,email:z.union([z.string().email().max(150),z.literal(''),z.null()]).optional(),
 instagram:nullable,facebook:nullable,location:nullable,contact_hours:nullable,
 bank_enabled:z.boolean().optional(), bank_name:nullable,bank_holder:nullable,
 bank_account:z.string().trim().max(40).nullable().optional(),bank_branch:nullable,
 bank_type:nullable,bank_instructions:nullable,cod_enabled:z.boolean().optional(),
 whatsapp_enabled:z.boolean().optional(),delivery_enabled:z.boolean().optional(),
 pickup_enabled:z.boolean().optional(),delivery_information:nullable,pickup_information:nullable,
 delivery_fee_jmd:z.number().int().min(0).nullable().optional(),store_paused:z.boolean().optional(),
 available_parishes:z.array(z.enum(parishes)).min(1).max(14).optional(),
 policies:z.string().max(12000).nullable().optional()
}).strict();
const variant=z.object({id:z.string().regex(/^[a-z0-9-]{2,64}$/),label:z.string().trim().min(2).max(100),ml:z.number().int().min(1).max(10000),priceJmd:z.number().int().min(0).max(10000000).nullable(),available:z.boolean(),stockCount:z.number().int().min(0).nullable().optional()});
const product=z.object({
 id:z.string().regex(/^[a-z0-9-]{2,64}$/),slug:z.string().regex(/^[a-z0-9-]{2,100}$/),
 name:z.string().trim().min(2).max(120),subtitle:z.string().max(180),description:z.string().max(3000),
 image:z.string().max(600).nullable().optional(),labelImage:z.string().max(600).nullable().optional(),
 benefits:z.array(z.string().max(150)).max(12), howToUse:z.string().max(2500),ingredientsNote:z.string().max(2500),
 caution:z.string().max(2000),category:z.array(z.enum(['Hair','Skin','Multipurpose'])).min(1).max(3),
 accent:z.enum(['amber','coconut','olive','palm','jojoba','rosemary','avocado']),
 featured:z.boolean(),active:z.boolean(),badge:z.string().max(50).nullable().optional(),
 sortOrder:z.number().int().min(0).max(10000),variants:z.array(variant).min(1).max(20)
});
const statuses=['new_request','pending','awaiting_payment','payment_submitted','payment_verified','processing','ready_for_pickup','dispatched','completed','cancelled','quoted','confirmed','fulfilled'] as const;
export async function GET(req:NextRequest){
 try{
  const admin=await owner(req);if(!admin)return err('Owner access required.',403);
  const section=new URL(req.url).searchParams.get('section')||'overview';const sb=db();
  if(section==='settings')return NextResponse.json({settings:await settings()});
  if(section==='products'){
   const [p,v]=await Promise.all([sb.from('store_products').select('*').order('sort_order'),sb.from('store_variants').select('*').order('sort_order')]);
   if(p.error||v.error)return err('Unable to load products.',503);
   return NextResponse.json({products:p.data,variants:v.data});
  }
  if(section==='orders'){
   const {data,error}=await sb.from('store_orders').select('*').order('created_at',{ascending:false}).limit(250);
   return error?err('Unable to load orders.',503):NextResponse.json({orders:data});
  }
  if(section==='audit'){
   const {data,error}=await sb.from('store_admin_audit').select('created_at,event,entity_id,admin_user_id').order('created_at',{ascending:false}).limit(100);
   return error?err('Audit log unavailable.',503):NextResponse.json({audit:data});
  }
  const {data,error}=await sb.from('store_orders').select('status,priced_subtotal_jmd,created_at');
  if(error)return err('Unable to load sales summary.',503);
  return NextResponse.json({ordersCount:data.length,completed:data.filter(x=>x.status==='completed').length,
   verifiedRevenueJmd:data.filter(x=>x.status==='completed'&&x.priced_subtotal_jmd>0).reduce((a,x)=>a+x.priced_subtotal_jmd,0),
   awaitingPayment:data.filter(x=>x.status==='awaiting_payment'||x.status==='payment_submitted').length});
 }catch{return err('Admin dashboard is not configured.',503);}
}
export async function POST(req:NextRequest){
 try{
  const admin=await owner(req);if(!admin)return err('Owner access required.',403);
  const raw=await req.json();const action=raw?.action;const sb=db();
  if(action==='saveSettings'){
   const v=merchantSchema.safeParse(raw.settings);if(!v.success)return err('Please check the settings fields.');
   const next={...v.data};
   for(const field of ['phone','whatsapp'] as const){
    if(next[field]){const normalized=toPhone(next[field]!);if(!normalized)return err('Enter a valid Jamaican telephone number (876 or 658).');next[field]=normalized;}
   }
   for(const field of ['instagram','facebook'] as const){
    if(next[field]){try{const url=new URL(next[field]!);if(url.protocol!=='https:')return err('Social links must use HTTPS.');}catch{return err('Enter a complete HTTPS social link.');}}
   }
   const prev=await settings();const merged={...prev,...next};
   if(merged.bank_enabled&&!(merged.bank_account&&merged.bank_name&&merged.bank_holder))return err('Bank name, holder and account are required.');
   if(merged.whatsapp_enabled&&!merged.whatsapp)return err('Save a WhatsApp number first.');
   if(!merged.store_paused&&!(merged.bank_enabled||merged.cod_enabled||merged.whatsapp_enabled))return err('Enable a payment method before opening the store.');
   if(!merged.store_paused&&!(merged.delivery_enabled||merged.pickup_enabled))return err('Enable delivery or pickup before opening.');
   const changed=Object.keys(next).filter(k=>JSON.stringify(next[k as keyof typeof next])!==JSON.stringify(prev[k as keyof typeof prev]));
   if(changed.some(k=>k.startsWith('bank_'))){
    if(typeof raw.passwordConfirmation!=='string'||!raw.passwordConfirmation)return err('Confirm your owner password to change bank details.',403);
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if(!url||!key)return err('Reauthentication unavailable.',503);
    const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const check=await auth.auth.signInWithPassword({email:admin.email!,password:raw.passwordConfirmation});
    if(check.error||check.data.user?.id!==admin.id)return err('Password confirmation failed. No changes saved.',403);
   }
   const {error}=await sb.rpc('save_cardones_merchant',{p_actor:admin.id,p_settings:next,p_fields:changed});
   return error?err('Settings could not be saved.',503):NextResponse.json({ok:true});
  }
  if(action==='seedCatalog'){
   const {error}=await sb.rpc('seed_cardones_catalogue',{p_actor:admin.id,p_products:products.map((p,i)=>({...p,featured:!!p.featured,active:true,sortOrder:i}))});
   return error?err('Import failed. Check migrations and whether the catalogue is already initialized.',409):NextResponse.json({ok:true});
  }
  if(action==='saveProduct'){
   const v=product.safeParse(raw.product);if(!v.success)return err('Invalid product data. Check sizes, prices and required fields.');
   const p=v.data;
   const validImg=(path:string|null|undefined)=>!path||path.startsWith('/images/')||/^https:\/\/[a-zA-Z0-9.-]+\/[^\s]*$/.test(path);
   if(!validImg(p.image)||!validImg(p.labelImage))return err('Upload an image or use a secure approved URL.');
   const ids=new Set(p.variants.map(x=>x.id));if(ids.size!==p.variants.length)return err('Duplicate size IDs.');
   const {error}=await sb.rpc('save_cardones_catalogue_product',{p_actor:admin.id,p_product:p});
   return error?err('Product save failed. Check unique page and size IDs; no changes saved.',409):NextResponse.json({ok:true});
  }
  if(action==='verifyBankCredit'){
   const v=z.object({id:z.string().uuid(),creditReference:z.string().trim().min(4).max(100),amountJmd:z.number().finite().nonnegative(),reviewNote:z.string().max(600),bankConfirmed:z.literal(true)}).safeParse(raw);
   if(!v.success)return err('Enter the bank credit details and confirm that you independently checked cleared funds.');
   const x=v.data;
   const result=await sb.rpc('verify_cardones_bank_credit',{p_actor:admin.id,p_id:x.id,p_credit:x.creditReference,p_amount:x.amountJmd,p_note:x.reviewNote});
   return result.error?err(result.error.code==='23505'?'That bank credit has already been assigned to an order.':result.error.message,400):NextResponse.json({ok:true});
  }
  if(action==='updateOrder'){
   // Validate only relevant keys (including action) separately.
   const id=raw.id,status=raw.status;
   if(status==='payment_verified')return err('Use the bank verification form to record cleared funds.');
   if(typeof id!=='string'||!z.string().uuid().safeParse(id).success||!statuses.includes(status))return err('Invalid order update.');
   const {data:before,error:ex}=await sb.from('store_orders').select('status,payment_method,shipping_service').eq('id',id).single();
   if(ex||!before)return err('Order not found.',404);
   if(status==='payment_verified' && before.payment_method!=='bank_transfer'&&!before.shipping_service)return err('Only bank transfers can be manually marked verified.');
   const result=await sb.rpc('update_cardones_order',{p_actor:admin.id,p_id:id,p_status:status});
   return result.error?err(result.error.message||'Order status change failed.',400):NextResponse.json({ok:true});
  }
  return err('Unknown admin operation.');
 }catch{return err('Admin action unavailable or not configured.',503);}
}