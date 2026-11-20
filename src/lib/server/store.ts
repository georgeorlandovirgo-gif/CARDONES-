import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { createHash, createHmac } from 'node:crypto';
import { products, type Product } from '@/lib/catalog';

export function db() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error('Store database is not configured.');
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
export async function owner(req: NextRequest) {
 const bearer=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
 if (!bearer) return null;
 const allowed=(process.env.ADMIN_USER_IDS || '').split(',').map(x=>x.trim()).filter(Boolean);
 if(!allowed.length) return null;
 const supabase=db();
 const {data:{user},error}=await supabase.auth.getUser(bearer);
 if(error || !user || !allowed.includes(user.id)) return null;
 return user;
}
export function toPhone(raw: string | null) {
 if(!raw)return null;
 const digits=raw.replace(/\D/g,'');
 if(/^1?876\d{7}$/.test(digits)||/^1?658\d{7}$/.test(digits))return digits.length===10?'1'+digits:digits;
 return null;
}
export type MerchantSettings = {
 phone: string | null; whatsapp: string | null; email: string | null;
 instagram: string | null; facebook: string | null; location: string | null;
 contact_hours: string | null; bank_enabled:boolean; cod_enabled:boolean;
 whatsapp_enabled:boolean; delivery_enabled:boolean; pickup_enabled:boolean;
 delivery_information:string|null;pickup_information:string|null;delivery_fee_jmd:number|null;
 store_paused:boolean;bank_name:string|null;bank_holder:string|null;bank_account:string|null;
 bank_branch:string|null;bank_type:string|null;bank_instructions:string|null; policies:string|null;
};
export const fallbackSettings:MerchantSettings={
 phone:null,whatsapp:null,email:null,instagram:null,facebook:null,
 location:'St. Elizabeth, Jamaica', contact_hours:null,
 bank_enabled:false,cod_enabled:false,whatsapp_enabled:false,
 delivery_enabled:true,pickup_enabled:true,delivery_information:null,pickup_information:null,
 delivery_fee_jmd:null,store_paused:false,bank_name:null,bank_holder:null,
 bank_account:null,bank_branch:null,bank_type:null,bank_instructions:null,policies:null
};
export async function settings():Promise<MerchantSettings>{
 const {data,error}=await db().from('store_settings').select('*').eq('id','main').single();
 if(error||!data)throw new Error('Merchant settings unavailable. Run database migration.');
 return {...fallbackSettings,...data};
}
export function publicSettings(s:MerchantSettings){
 // Bank account details are CUSTOMER-FACING only when the merchant enables transfer.
 return {phone:s.phone,whatsapp:s.whatsapp_enabled?s.whatsapp:null,email:s.email,
 instagram:s.instagram,facebook:s.facebook,location:s.location,contactHours:s.contact_hours,
 payment:{bankTransfer:s.bank_enabled&&Boolean(s.bank_account&&s.bank_name),
 cash:s.cod_enabled,whatsapp:s.whatsapp_enabled&&Boolean(s.whatsapp),
 bank:s.bank_enabled&&s.bank_account&&s.bank_name?{
 name:s.bank_name,holder:s.bank_holder,account:s.bank_account,
 branch:s.bank_branch,type:s.bank_type,instructions:s.bank_instructions}:null},
 delivery:s.delivery_enabled,pickup:s.pickup_enabled,deliveryInformation:s.delivery_information,
 pickupInformation:s.pickup_information,deliveryFeeJmd:s.delivery_fee_jmd,
 paused:s.store_paused,policies:s.policies};
}
export type ProductRecord = Record<string,unknown>;
export function normalizeProduct(row:ProductRecord,variants:ProductRecord[]):Product{
 const accent=['amber','coconut','olive','palm','jojoba','rosemary','avocado'].includes(String(row.accent))?row.accent as Product['accent']:'amber';
 const rawCategories=Array.isArray(row.categories)?row.categories:[];
 const categories=rawCategories.filter((x):x is Product['category'][number]=>x==='Hair'||x==='Skin'||x==='Multipurpose');
 return {id:String(row.id),slug:String(row.slug),name:String(row.name),subtitle:String(row.subtitle||''),
 description:String(row.description||''),accent,category:categories,image:typeof row.image==='string'?row.image:undefined,
 labelImage:typeof row.label_image==='string'?row.label_image:undefined,
 benefits:Array.isArray(row.benefits)?row.benefits.filter((x):x is string=>typeof x==='string'):[],
 howToUse:String(row.how_to_use||''),ingredientsNote:String(row.ingredients_note||''),caution:String(row.caution||''),
 featured:row.featured===true,badge:typeof row.badge==='string'?row.badge:undefined,
 variants:variants.filter(v=>v.product_id===row.id).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0))
 .map(v=>({id:String(v.id),label:String(v.label),ml:Number(v.ml),
 priceJmd:v.price_jmd===null?null:Number(v.price_jmd),available:v.available===true,stockCount:typeof v.stock_count==="number"?v.stock_count:null}))};
}
export async function catalog():Promise<Product[]> {
 const sb=db();const [p,v]=await Promise.all([
 sb.from('store_products').select('*').eq('active',true).order('sort_order'),
 sb.from('store_variants').select('*').order('sort_order')]);
 if(p.error||v.error)throw new Error('Catalogue database is unavailable.');
 if(!p.data?.length)return products; // safe baseline before owner's first catalogue import
 return p.data.map(row=>normalizeProduct(row,v.data||[]));
}
export async function rateLimit(req:NextRequest){
 const secret=process.env.RATE_LIMIT_SECRET;
 if(!secret)throw new Error('RATE_LIMIT_SECRET must be configured before accepting orders.');
 const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
 if(!ip)throw new Error('Unable to verify request origin.');
 const fingerprint=createHmac('sha256',secret).update(ip).digest('hex');
 const sb=db(); const since=new Date(Date.now()-3600_000).toISOString();
 const {count,error}=await sb.from('store_request_limits').select('*',{count:'exact',head:true}).eq('fingerprint',fingerprint).gte('created_at',since);
 if(error)throw new Error('Request protection unavailable.');
 if((count||0)>=6)throw new Error('Too many order attempts. Please try later.');
 const ins=await sb.from('store_request_limits').insert({fingerprint});
 if(ins.error)throw new Error('Request protection unavailable.');
}
export function signature(s:string){return createHash('sha256').update(s).digest('hex');}