import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkOwner } from "@/lib/server/database";
import { orderStatusSchema } from "@/lib/store-validation";
export const dynamic="force-dynamic";
const updateSchema=z.object({reference:z.string().min(8).max(80),status:orderStatusSchema,payment_status:z.enum(["unpaid","submitted","verified","not_required"])});
function fail(message:string,status=400){return NextResponse.json({ok:false,message},{status});}
export async function GET(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return fail(owner.error || "Not authorised",owner.status || 403);
 const {data,error}=await owner.db.from("store_orders").select("*").order("created_at",{ascending:false}).limit(300);
 if(error)return fail("Could not load orders.",503);
 return NextResponse.json({ok:true,orders:data||[]},{headers:{"Cache-Control":"no-store"}});
}
export async function PATCH(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return fail(owner.error || "Not authorised",owner.status || 403);
 const parsed=updateSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return fail("Invalid order update.");
 const {reference,status,payment_status}=parsed.data;
 // Submitted receipts NEVER set payment status to verified without a separate owner's explicit action.
 const {data,error}=await owner.db.rpc("save_cardones_order_status",{p_actor:owner.user.id,p_reference:reference,p_status:status,p_payment_status:payment_status});
 if(error||!data)return fail("Order not found or could not be updated.",404);
 return NextResponse.json({ok:true,order:data});
}
