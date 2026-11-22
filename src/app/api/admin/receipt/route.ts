import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {db,owner} from '@/lib/server/store';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 try{
  if(!await owner(req))return NextResponse.json({error:'Owner only.'},{status:403});
  const id=new URL(req.url).searchParams.get('orderId');
  if(!z.string().uuid().safeParse(id).success)return NextResponse.json({error:'Invalid order reference.'},{status:400});
  const sb=db();const {data,error}=await sb.from('store_orders').select('receipt_path').eq('id',id!).single();
  if(error||!data?.receipt_path)return NextResponse.json({error:'Receipt not found.'},{status:404});
  const signed=await sb.storage.from('cardones-receipts').createSignedUrl(data.receipt_path,60,{download:true});
  if(signed.error||!signed.data?.signedUrl)return NextResponse.json({error:'Receipt temporarily unavailable.'},{status:503});
  return NextResponse.json({url:signed.data.signedUrl},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Unable to open receipt.'},{status:503});}
}