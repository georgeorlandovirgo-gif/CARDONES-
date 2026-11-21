import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {db,owner} from '@/lib/server/store';
import {listStories} from '@/lib/server/testimonials';
export const dynamic='force-dynamic';
function reply(data:unknown,status=200){return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function GET(req:NextRequest){try{
 if(!await owner(req))return reply({message:'Owner access required.'},403);
 const status=req.nextUrl.searchParams.get('status')||'pending';const page=Number(req.nextUrl.searchParams.get('page')||0);
 if(!['pending','approved','rejected','hidden','all'].includes(status)||!Number.isInteger(page)||page<0||page>10000)return reply({message:'Invalid filter.'},400);
 return reply(await listStories(true,status,page));
 }catch{return reply({message:'Testimonial management is unavailable. Check migration 004.'},503);}}
export async function PATCH(req:NextRequest){try{
 const admin=await owner(req);if(!admin)return reply({message:'Owner access required.'},403);
 const parsed=z.object({id:z.string().uuid(),status:z.enum(['approved','rejected','hidden'])}).strict().safeParse(await req.json());
 if(!parsed.success)return reply({message:'Invalid review decision.'},400);
 const {error}=await db().rpc('moderate_cardones_testimonial',{p_actor:admin.id,p_id:parsed.data.id,p_status:parsed.data.status});
 return error?reply({message:'Decision was not saved. Please retry.'},503):reply({ok:true});
 }catch{return reply({message:'Decision could not be saved.'},503);}}
