import { NextRequest, NextResponse } from "next/server";
import { checkOwner } from "@/lib/server/database";
import { products as defaults } from "@/lib/catalog";
import { productUpdateSchema } from "@/lib/store-validation";
export const dynamic="force-dynamic";
function fail(message:string,status=400){return NextResponse.json({ok:false,message},{status});}
export async function GET(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return fail(owner.error || "Not authorised",owner.status || 403);
 const {data,error}=await owner.db.from("store_products").select("id,slug,data,active,sort_order").order("sort_order");
 if(error)return fail("Could not load products.",503);
 const changes=new Map((data||[]).map(row=>[row.id,row]));
 const all=defaults.map(p=>changes.get(p.id)?.data||p);
 const existing=new Set(defaults.map(p=>p.id));
 for(const entry of data||[])if(!existing.has(entry.id))all.push(entry.data);
 return NextResponse.json({ok:true,overrides:data||[],catalog:all},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return fail(owner.error || "Not authorised",owner.status || 403);
 const json=await req.json().catch(()=>null);
 const parsed=productUpdateSchema.safeParse(json);
 if(!parsed.success)return fail(parsed.error.issues[0]?.message || "Check the product information.");
 const {product,active,sort_order}=parsed.data;
 // Changing any existing product ID, slug or price is an authenticated and audited operation.
 const {error}=await owner.db.rpc("save_cardones_product",{p_actor:owner.user.id,p_id:product.id,p_slug:product.slug,p_data:product,p_active:active,p_sort_order:sort_order});
 if(error)return fail("Could not save product. Check that its ID and URL slug are unique.",409);
 return NextResponse.json({ok:true,product});
}
