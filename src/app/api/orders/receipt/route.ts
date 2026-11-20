import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { serviceDatabase } from "@/lib/server/database";
export const runtime="nodejs";
const fail=(message:string,status=400)=>NextResponse.json({ok:false,message},{status});
export async function POST(req:NextRequest){
 const db=serviceDatabase();if(!db)return fail("Receipt upload is unavailable.",503);
 if(Number(req.headers.get("content-length")||0)>4_000_000)return fail("File exceeds size limit.",413);
 const form=await req.formData().catch(()=>null);
 const reference=form?.get("reference"),token=form?.get("receiptToken"),file=form?.get("receipt");
 if(typeof reference!=="string"||!/^[A-Z0-9-]{12,50}$/.test(reference)||typeof token!=="string"||token.length!==56||!(file instanceof File))return fail("Invalid upload request.");
 if(file.size>3_145_728||file.size<80)return fail("File must be under 3 MB.");
 const ext:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf"};
 if(!ext[file.type])return fail("Use a JPG, PNG, WebP or PDF receipt.");
 const bytes=new Uint8Array(await file.arrayBuffer());
 const sig=file.type==="image/jpeg"?bytes[0]===0xff&&bytes[1]===0xd8:
 file.type==="image/png"?bytes.slice(0,8).join(",")==="137,80,78,71,13,10,26,10":
 file.type==="image/webp"?String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP":
 String.fromCharCode(...bytes.slice(0,4))==="%PDF";
 if(!sig)return fail("Invalid file content.");
 const {data,error}=await db.from("store_orders").select("receipt_token_hash,payment_method,payment_status,created_at,receipt_path").eq("reference",reference).maybeSingle();
 if(error||!data||data.payment_method!=="bank_transfer"||!data.receipt_token_hash)return fail("Invalid receipt reference.",403);
 if(data.receipt_path)return fail("A receipt has already been submitted. Please contact the merchant.",409);
 if(Date.now()-new Date(data.created_at).getTime()>7*24*60*60*1000)return fail("The receipt upload window has expired.",403);
 const check=Buffer.from(createHash("sha256").update(token).digest("hex"),"hex");
 const expected=Buffer.from(data.receipt_token_hash,"hex");
 if(check.length!==expected.length||!timingSafeEqual(check,expected))return fail("Invalid receipt token.",403);
 const path=reference+"/"+randomUUID()+"."+ext[file.type];
 const uploaded=await db.storage.from("cardones-receipts").upload(path,bytes,{contentType:file.type,upsert:false});
 if(uploaded.error)return fail("Receipt upload could not be completed.",503);
 const updated=await db.from("store_orders").update({receipt_path:path,payment_status:"submitted",status:"payment_submitted",updated_at:new Date().toISOString()}).eq("reference",reference).is("receipt_path",null);
 if(updated.error)return fail("Receipt saved, but order status could not be updated. Please contact the merchant.",503);
 return NextResponse.json({ok:true,message:"Receipt submitted for manual review. This does not confirm payment."});
}
