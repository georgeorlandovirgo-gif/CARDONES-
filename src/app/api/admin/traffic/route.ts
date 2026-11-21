import {NextRequest,NextResponse} from 'next/server';
import {db,owner} from '@/lib/server/store';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{'Cache-Control':'no-store'}});try{
 if(!await owner(req))return reply({message:'Owner access required.'},403);
 const days=Number(req.nextUrl.searchParams.get('days')||30);if(![7,30,90].includes(days))return reply({message:'Invalid reporting period.'},400);
 const {data,error}=await db().rpc('cardones_traffic_report',{p_days:days});if(error)throw error;
 return reply({...data,enabled:process.env.TRAFFIC_ENABLED==='true'&&Boolean(process.env.TRAFFIC_SECRET)});
 }catch{return reply({message:'Traffic reports are unavailable. Check database migration 005 and server configuration.'},503);}}
