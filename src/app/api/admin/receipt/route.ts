import { NextRequest, NextResponse } from "next/server";
import { checkOwner } from "@/lib/server/database";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest) {
 const owner=await checkOwner(req);if("error" in owner)return NextResponse.json({message:owner.error},{status:owner.status});
 const ref=req.nextUrl.searchParams.get("reference");
 if(!ref||ref.length>80)return NextResponse.json({message:"Invalid reference."},{status:400});
 const {data,error}=await owner.db.from("store_orders").select("receipt_path").eq("reference",ref).maybeSingle();
 if(error || !data?.receipt_path)return NextResponse.json({message:"No receipt attached."},{status:404});
 const signed=await owner.db.storage.from("cardones-receipts").createSignedUrl(data.receipt_path,60);
 if(signed.error||!signed.data)return NextResponse.json({message:"Receipt temporarily unavailable."},{status:503});
 return NextResponse.json({ok:true,url:signed.data.signedUrl},{headers:{"Cache-Control":"private,no-store"}});
}
