import type {NextRequest} from 'next/server';
export async function limitedForm(req:NextRequest,max:number){const type=req.headers.get('content-type');if(!type?.startsWith('multipart/form-data'))throw Error('Use the checkout form.');const reader=req.body?.getReader();if(!reader)throw Error('Empty request.');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Upload is too large. Maximum proof size is 5 MB.');}chunks.push(value);}return new Response(Buffer.concat(chunks),{headers:{'Content-Type':type}}).formData();}
export function proofType(bytes:Buffer){if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))return {mime:'image/jpeg',ext:'jpg'};if(bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return {mime:'image/png',ext:'png'};if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return {mime:'image/webp',ext:'webp'};if(bytes.toString('ascii',0,5)==='%PDF-')return {mime:'application/pdf',ext:'pdf'};throw Error('Use a JPG, PNG, WebP or PDF proof of payment.');}

// Decode and re-encode images: a plausible file header alone is not sufficient.
// PDFs remain private downloads; this is not a malware scanner or fraud detector.
export async function prepareProof(bytes:Buffer){
 const type=proofType(bytes);
 if(type.mime==='application/pdf')return {bytes,...type};
 const sharp=(await import('sharp')).default;
 const input=sharp(bytes,{limitInputPixels:16_000_000,failOn:'error'});
 const metadata=await input.metadata();
 if((metadata.pages||1)>1)throw Error('Use a single still image or PDF.');
 const clean=await input.rotate().resize({width:3000,height:3000,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 if(clean.length>5*1024*1024)throw Error('The processed image exceeds 5 MB. Please use a smaller image.');
 return {bytes:clean,mime:'image/png',ext:'png'};
}
