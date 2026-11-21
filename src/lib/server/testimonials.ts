import 'server-only';
import {db} from './store';
import type {CustomerStory,ModeratedStory} from '@/lib/testimonials';
export const storyBucket='cardones-testimonials';
export const storiesReady=()=>Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
export const acceptsStories=()=>storiesReady()&&process.env.TESTIMONIAL_SUBMISSIONS_ENABLED==='true'&&Boolean(process.env.RATE_LIMIT_SECRET);
export async function listStories(admin=false,status='approved',page=0){
 const sb=db();
 let query=sb.from('store_testimonials').select(admin?'*':'id,display_name,product_id,product_name,title,story,duration,published_at,photos').order(admin?'created_at':'published_at',{ascending:false}).range(page*12,page*12+12);
 if(!admin||status!=='all')query=query.eq('status',admin?status:'approved');
 const {data,error}=await query;
 if(error)throw Error('Stories could not be loaded.');
 const rows=await Promise.all(((data||[]) as unknown as Array<Record<string,unknown>>).slice(0,12).map(async row=>{
  const photos=await Promise.all((row.photos as Array<{path:string;label:string;caption:string}>).map(async p=>{
   const signed=await sb.storage.from(storyBucket).createSignedUrl(p.path,admin?60:300);
   if(signed.error)throw Error('Photos could not be loaded.');
   return {url:signed.data.signedUrl,label:p.label,caption:p.caption};
  }));
  return {...row,photos};
 }));
 return {stories:rows as unknown as Array<CustomerStory|ModeratedStory>,hasMore:(data||[]).length>12};
}
