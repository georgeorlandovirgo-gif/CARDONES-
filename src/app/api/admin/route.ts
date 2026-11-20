import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, owner, settings, toPhone } from '@/lib/server/store';
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
 policies:z.string().max(12000).nullable().optional()
}).strict();
const variant=z.object({id:z.string().regex(/^[a-z0-9-]{2,64}$/),label:z.string().trim().min(2).max(100),ml:z.number().int().min(1).max(10000),priceJmd:z.number().int().min(0).max(10000000).nullable(),available:z.boolean(),stockCount:z.number().int().min(0).nullable().optional()});
const product=z.object({
 id:z.string().regex(/^[a-z0-9-]{2,64}$/),slug:z.string().regex(/^[a-z0-9-]{2,100}$/),
 name:z.string().trim().min(2).max(120),subtitle:z.string().max(180),description:z.string().max(3000),
 image:z.string().max(600).nullable().optional(),labelImage:z.string().max(600).nullable().optional(),
 benefits:z.array(z.string().max(150)).max(12), howToUse:z.string().max(2500),ingredientsNote:z.string().max(2500),
 caution:z.string().max(2000),category:z.array(z.enum(['Hair','Skin','Multipurpose'])).max(3),
 accent:z.enum(['amber','coconut','olive','palm','jojoba','rosemary','avocado']),
 featured:z.boolean(),active:z.boolean(),badge:z.string().max(50).nullable().optional(),
 sortOrder:z.number().int().min(0).max(10000),variants:z.array(variant).min(1).max(20)
});
const statuses=['new_request','pending','awaiting_payment','payment_submitted','payment_verified','processing','ready_for_pickup','dispatched','completed','cancelled','quoted','confirmed','fulfilled'] as const;
async function audit(adminId:string,event:string,entityId:string,before:unknown,after:unknown){
 const {error}=await db().from('store_admin_audit').insert({admin_user_id:adminId,event,entity_id:entityId,before_data:before||null,after_data:after||null});
 if(error)throw Error('Audit log unavailable; change aborted.');
}
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
   const next=v.data;
   if(next.whatsapp&& !toPhone(next.whatsapp))return err('WhatsApp must be a valid Jamaican number with 876 or 658 area code.');
   if(next.phone&& !toPhone(next.phone))return err('Enter a valid Jamaican phone number.');
   const prev=await settings();
   if(next.bank_enabled&&!(next.bank_account??prev.bank_account)||next.bank_enabled&&!(next.bank_name??prev.bank_name))return err('Bank name and account are required to enable bank transfer.');
   if(next.whatsapp_enabled&&!(next.whatsapp??prev.whatsapp))return err('Save a WhatsApp number first.');
   // Write audit before mutation to fail closed. Only record changed names, never account numbers in logs.
   const sensitive=Object.keys(next).some(k=>k.startsWith('bank_'));
   await audit(admin.id,sensitive?'bank_settings_changed':'store_settings_changed','main',
    {fields:Object.keys(next)}, {fields:Object.keys(next),bankUpdated:sensitive});
   const {error}=await sb.from('store_settings').update({...next,updated_at:new Date().toISOString()}).eq('id','main');
   return error?err('Settings could not be saved.',503):NextResponse.json({ok:true});
  }
  if(action==='seedCatalog'){
   const {count,error:countError}=await sb.from('store_products').select('*',{count:'exact',head:true});
   if(countError)return err('Products database is unavailable. Run the migration.',503);
   if((count||0)>0)return err('Catalogue already initialized. Import is only allowed when empty.');
   for(let i=0;i<products.length;i++){
    const p=products[i];
    const row={id:p.id,slug:p.slug,name:p.name,subtitle:p.subtitle,description:p.description,
      image:p.image||null,label_image:p.labelImage||null,benefits:p.benefits,how_to_use:p.howToUse,
      ingredients_note:p.ingredientsNote,caution:p.caution,categories:p.category,accent:p.accent,
      featured:!!p.featured,badge:p.badge||null,active:true,sort_order:i};
    const {error:e}=await sb.from('store_products').insert(row);if(e)return err('Product import was interrupted; review the database.',503);
    const {error:ve}=await sb.from('store_variants').insert(p.variants.map((v,j)=>({id:v.id,product_id:p.id,label:v.label,ml:v.ml,price_jmd:v.priceJmd,available:v.available,sort_order:j})));
    if(ve)return err('Variant import was interrupted.',503);
   }
   await audit(admin.id,'catalogue_seeded','all',null,{count:products.length});
   return NextResponse.json({ok:true});
  }
  if(action==='saveProduct'){
   const v=product.safeParse(raw.product);if(!v.success)return err('Invalid product data. Check sizes, prices and required fields.');
   const p=v.data;
   const validImg=(path:string|null|undefined)=>!path||path.startsWith('/images/')||/^https:\/\/[a-zA-Z0-9.-]+\/[^\s]*$/.test(path);
   if(!validImg(p.image)||!validImg(p.labelImage))return err('Upload an image or use a secure approved URL.');
   const ids=new Set(p.variants.map(x=>x.id));if(ids.size!==p.variants.length)return err('Duplicate size IDs.');
   const {data:before}=await sb.from('store_products').select('id,name,slug').eq('id',p.id).maybeSingle();
   await audit(admin.id,'product_updated',p.id,before,{id:p.id,name:p.name,variantCount:p.variants.length});
   const row={id:p.id,slug:p.slug,name:p.name,subtitle:p.subtitle,description:p.description,image:p.image||null,
    label_image:p.labelImage||null,benefits:p.benefits,how_to_use:p.howToUse,ingredients_note:p.ingredientsNote,
    caution:p.caution,categories:p.category,accent:p.accent,featured:p.featured,active:p.active,
    badge:p.badge||null,sort_order:p.sortOrder,updated_at:new Date().toISOString()};
   const up=await sb.from('store_products').upsert(row,{onConflict:'id'});if(up.error)return err('Product save failed.',503);
   const old=await sb.from('store_variants').select('id').eq('product_id',p.id);if(old.error)return err('Variant lookup failed.',503);
   for(const v of p.variants){const r=await sb.from('store_variants').upsert({id:v.id,product_id:p.id,label:v.label,ml:v.ml,
    price_jmd:v.priceJmd,available:v.available,stock_count:v.stockCount??null,sort_order:p.variants.indexOf(v)},{onConflict:'id'});if(r.error)return err('Variant save failed.',503);}
   const removed=(old.data||[]).map(x=>x.id).filter(id=>!ids.has(id));
   if(removed.length){const d=await sb.from('store_variants').delete().in('id',removed).eq('product_id',p.id);if(d.error)return err('Variant removal failed.',503);}
   return NextResponse.json({ok:true});
  }
  if(action==='updateOrder'){
   // Validate only relevant keys (including action) separately.
   const id=raw.id,status=raw.status;
   if(typeof id!=='string'||!z.string().uuid().safeParse(id).success||!statuses.includes(status))return err('Invalid order update.');
   const {data:before,error:ex}=await sb.from('store_orders').select('status,payment_method').eq('id',id).single();
   if(ex||!before)return err('Order not found.',404);
   if(status==='payment_verified' && before.payment_method!=='bank_transfer')return err('Only bank transfers can be manually marked verified.');
   await audit(admin.id,status==='payment_verified'?'manual_payment_verified':'order_status_changed',id,{status:before.status},{status});
   const update:Record<string,unknown>={status,updated_at:new Date().toISOString()};
   if(status==='payment_verified')update.payment_verified_at=new Date().toISOString();
   const result=await sb.from('store_orders').update(update).eq('id',id);
   return result.error?err('Order status change failed.',503):NextResponse.json({ok:true});
  }
  return err('Unknown admin operation.');
 }catch{return err('Admin action unavailable or not configured.',503);}
}