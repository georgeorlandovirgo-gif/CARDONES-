import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {testimonialSchema,MAX_PHOTO_BYTES} from '@/lib/testimonials';
import {catalog,db,rateLimit} from '@/lib/server/store';
import {normalizeStoryPhoto} from '@/lib/server/testimonial-photos';
import {acceptsStories,storiesReady,storyBucket,listStories} from '@/lib/server/testimonials';
export const dynamic='force-dynamic';export const runtime='nodejs';
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET(req:NextRequest){
 if(!storiesReady())return reply({stories:[],hasMore:false,acceptingSubmissions:false,backendReady:false});
 try{const page=Number(req.nextUrl.searchParams.get('page')||0);if(!Number.isInteger(page)||page<0||page>10000)return reply({message:'Invalid page.'},400);
 return reply({...await listStories(false,'approved',page),acceptingSubmissions:acceptsStories(),backendReady:true});
 }catch{return reply({message:'Customer stories are temporarily unavailable.'},503);}
}
export async function POST(req:NextRequest){
 if(!acceptsStories())return reply({message:'Story submissions are not currently enabled. Please try again later.'},503);
 const uploaded:string[]=[];
 try{
  if(!req.headers.get('content-type')?.startsWith('multipart/form-data'))return reply({message:'Use the story submission form.'},415);
  await rateLimit(req,'testimonials');
  // Enforce a streaming request limit even when Content-Length is missing or false.
  const max=3*MAX_PHOTO_BYTES+32000;const reader=req.body?.getReader();if(!reader)return reply({message:'Empty submission.'},400);
  const chunks:Uint8Array[]=[];let length=0;
  while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();return reply({message:'Photos exceed the upload limit.'},413);}chunks.push(value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers.get('content-type')!}}).formData();
  const raw=form.get('story');if(typeof raw!=='string'||raw.length>16000)return reply({message:'Invalid story details.'},400);
  let json:unknown;try{json=JSON.parse(raw);}catch{return reply({message:'Invalid story details.'},400);}
  const parsed=testimonialSchema.safeParse(json);if(!parsed.success)return reply({message:parsed.error.issues[0]?.message||'Check your story and consent.'},400);
  const x=parsed.data;const files=form.getAll('photos');
  if(files.length!==x.photos.length||files.length>3||files.some(f=>!(f instanceof File)||f.size>MAX_PHOTO_BYTES||f.size===0))return reply({message:'Add up to three valid photos, each no larger than 5 MB.'},400);
  const product=(await catalog()).find(p=>p.id===x.productId);if(!product)return reply({message:'Please choose a current Cardone’s product.'},400);
  const normalized:Buffer[]=[];
  try{for(const file of files)normalized.push(await normalizeStoryPhoto(Buffer.from(await (file as File).arrayBuffer())));}catch{return reply({message:'One photo could not be read. Use still JPG, PNG or WebP photos, up to 5 MB and 25 megapixels each.'},400);}
  const id=randomUUID();const sb=db();const photos=[];
  for(let i=0;i<normalized.length;i++){
   const path=`${id}/${randomUUID()}.jpg`;
   const {error}=await sb.storage.from(storyBucket).upload(path,normalized[i],{contentType:'image/jpeg',upsert:false});
   if(error)throw Error('Upload unavailable');uploaded.push(path);photos.push({...x.photos[i],path});
  }
  const {error}=await sb.from('store_testimonials').insert({id,display_name:x.displayName,email:x.email,product_id:product.id,product_name:product.name,title:x.title,story:x.story,duration:x.duration,photos,status:'pending',consent_version:'website-story-v1'});
  if(error)throw Error('Unable to save');
  return reply({ok:true,reference:id,message:'Thank you. Your story and photos are awaiting review and are not public yet.'},201);
 }catch(e){if(uploaded.length)await db().storage.from(storyBucket).remove(uploaded);
 const limited=e instanceof Error&&e.message.startsWith('Too many');return reply({message:limited?'Too many submissions. Please try again later.':'Your story could not be saved. Please try again.'},limited?429:503);}
}
