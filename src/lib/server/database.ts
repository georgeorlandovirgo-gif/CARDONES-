import "server-only";
import { createClient } from "@supabase/supabase-js";
import { products, type Product } from "@/lib/catalog";
import { defaultStoreSettings, type StoreSettings, publicSettings } from "@/lib/store-settings";

export function serviceDatabase() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function publicAuthClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url || !key) return null;
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function loadCatalog(strict=false): Promise<Product[]> {
 const db = serviceDatabase();
 if (!db) return products;
 const { data, error } = await db.from("store_products").select("id,data,active,sort_order").order("sort_order");
 if (error) {console.error("Store catalog unavailable", error.code);if(strict)throw Error("Product database is unavailable.");return products;}
 const overrides = new Map((data || []).map(row => [row.id, row]));
 const current = products.map((base, i) => {
   const record = overrides.get(base.id);
   return {p: record ? (record.data as Product) : base, order: record?.sort_order ?? i,
           active: record?.active ?? true};
 });
 const existing = new Set(products.map(p=>p.id));
 for (const row of data || []) if(!existing.has(row.id)) current.push({
   p: row.data as Product,order:row.sort_order, active:row.active
 });
 return current.filter(x=>x.active).sort((a,b)=>a.order-b.order).map(x=>x.p);
}
export async function loadSettings(): Promise<StoreSettings> {
 const db=serviceDatabase();
 if(!db)return defaultStoreSettings;
 const {data,error}=await db.from("store_settings").select("*").eq("id",1).maybeSingle();
 if (error){console.error("Store settings unavailable",error.code);return defaultStoreSettings;}
 return {...defaultStoreSettings,...(data||{})};
}
export async function getPublicStore() {
 const [catalog, settings] = await Promise.all([loadCatalog(),loadSettings()]);
 return {products:catalog,settings:publicSettings(settings)};
}
export async function addAudit(actor_id:string,action:string,entity:string,entity_id:string,fields_changed:string[]) {
 const db=serviceDatabase();
 if(!db)throw Error("Database unavailable");
 const {error}=await db.from("store_audit_log").insert({actor_id,action,entity,entity_id,fields_changed});
 if(error)throw Error("Audit logging failed");
}
export async function checkOwner(request:Request) {
 const db=serviceDatabase();
 if(!db) return {error:"Production database is not configured.",status:503} as const;
 const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
 if(!token) return {error:"Sign in to manage this store.",status:401} as const;
 const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user) return {error:"Your session has expired.",status:401} as const;
 const result=await db.from("store_admins").select("user_id").eq("user_id",user.id).eq("active",true).maybeSingle();
 if(result.error||!result.data)return {error:"Your account is not authorised to manage Cardone’s.",status:403} as const;
 return {db,user,token} as const;
}
