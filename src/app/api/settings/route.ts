import { NextResponse } from 'next/server';
import { settings, publicSettings } from '@/lib/server/store';
export const dynamic='force-dynamic';
export async function GET(){
 try{return NextResponse.json(publicSettings(await settings()),{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({error:'Store settings unavailable'},{status:503});}
}