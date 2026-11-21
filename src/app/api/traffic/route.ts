import {NextRequest,NextResponse} from 'next/server';
import {createHmac} from 'node:crypto';
import {z} from 'zod';
import {db} from '@/lib/server/store';
import {trackablePath} from '@/lib/traffic';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 const empty=()=>new NextResponse(null,{status:204,headers:{'Cache-Control':'no-store'}});
 if(process.env.TRAFFIC_ENABLED!=='true'||!process.env.TRAFFIC_SECRET||req.headers.get('dnt')==='1'||req.headers.get('sec-gpc')==='1')return empty();
 try{
 if(req.headers.get('origin')!==new URL(process.env.NEXT_PUBLIC_SITE_URL||req.url).origin)return empty();
 if(/bot|crawler|spider|headless/i.test(req.headers.get('user-agent')||''))return empty();
 const reader=req.body?.getReader();if(!reader)return empty();let length=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1024){await reader.cancel();return empty();}chunks.push(value);}
 const data=z.object({event:z.string().uuid(),session:z.string().uuid(),path:z.string().max(180)}).strict().safeParse(JSON.parse(Buffer.concat(chunks).toString()));
 if(!data.success||!trackablePath(data.data.path))return empty();
 const x=data.data;const key=createHmac('sha256',process.env.TRAFFIC_SECRET).update(x.session).digest('hex');
 await db().rpc('record_cardones_view',{p_event:x.event,p_session:key,p_path:x.path.replace(/\/$/,'')||'/'});
 }catch{}return empty();
}
