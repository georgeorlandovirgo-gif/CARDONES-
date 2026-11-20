import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { db,owner } from '@/lib/server/store';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  if(!await owner(req))return NextResponse.json({error:'Owner only'},{status:403});
  const form=await req.formData();const image=form.get('image');
  if(!(image instanceof File))return NextResponse.json({error:'Select a product image.'},{status:400});
  if(image.size>5*1024*1024||image.size===0)return NextResponse.json({error:'Image must be under 5 MB.'},{status:400});
  const buf=Buffer.from(await image.arrayBuffer());
  const jpg=buf.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff]));
  const png=buf.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));
  const webp=buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP';
  if(!jpg&&!png&&!webp)return NextResponse.json({error:'Only genuine JPEG, PNG or WebP images are accepted.'},{status:400});
  const mime=jpg?'image/jpeg':png?'image/png':'image/webp';const ext=jpg?'jpg':png?'png':'webp';
  const path=`products/${randomUUID()}.${ext}`;
  const sb=db();const {error}=await sb.storage.from('cardones-products').upload(path,buf,{contentType:mime,upsert:false,cacheControl:'3600'});
  if(error)return NextResponse.json({error:'Could not store the image.'},{status:503});
  const {data}=sb.storage.from('cardones-products').getPublicUrl(path);
  return NextResponse.json({url:data.publicUrl});
 }catch{return NextResponse.json({error:'Image upload unavailable.'},{status:503});}
}