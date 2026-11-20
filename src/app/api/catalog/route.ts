import { NextResponse } from 'next/server';
import { catalog } from '@/lib/server/store';
export const dynamic='force-dynamic';
export async function GET(){
 try {return NextResponse.json({products:await catalog()},{headers:{'Cache-Control':'no-store'}});}
 catch {return NextResponse.json({error:'Catalogue currently unavailable'},{status:503});}
}