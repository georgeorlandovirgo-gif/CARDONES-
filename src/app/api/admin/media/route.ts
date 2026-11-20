import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkOwner, addAudit } from "@/lib/server/database";
export const runtime="nodejs";
export async function POST(req:NextRequest) {
 const owner=await checkOwner(req);
 if("error" in owner)return NextResponse.json({message:owner.error},{status:owner.status});
 if(Number(req.headers.get("content-length")||0)>7_000_000)return NextResponse.json({message:"Image too large."},{status:413});
 const form=await req.formData().catch(()=>null);const file=form?.get("image");
 if(!(file instanceof File) || file.size<100 || file.size>5_000_000)return NextResponse.json({message:"Choose an image under 5MB."},{status:400});
 const formats:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
 const ext=formats[file.type];if(!ext)return NextResponse.json({message:"JPEG, PNG or WebP images only."},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());
 const valid=ext==="jpg" ? bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff :
 ext==="png" ? bytes.slice(0,8).join(",")==="137,80,78,71,13,10,26,10" :
 String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if(!valid)return NextResponse.json({message:"Image contents do not match the file type."},{status:400});
 const path="owner/"+randomUUID()+"."+ext;
 const {error}=await owner.db.storage.from("cardones-products").upload(path,bytes,{contentType:file.type,upsert:false});
 if(error)return NextResponse.json({message:"Could not upload image."},{status:503});
 await addAudit(owner.user.id,"image_uploaded","product_images",path,["image"]);
 const {data}=owner.db.storage.from("cardones-products").getPublicUrl(path);
 return NextResponse.json({ok:true,url:data.publicUrl});
}
