import {NextResponse} from 'next/server';
import {settings} from '@/lib/server/store';
export const dynamic='force-dynamic';
export async function GET(){
 try{const s=await settings();return NextResponse.json({store:"Cardone's Products",databaseReachable:true,ordersEnabled:!s.store_paused&&Boolean(process.env.RATE_LIMIT_SECRET)&&(s.cod_enabled||s.bank_enabled||s.whatsapp_enabled),paymentProcessing:false},{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({store:"Cardone's Products",databaseReachable:false,ordersEnabled:false,paymentProcessing:false},{status:503,headers:{'Cache-Control':'no-store'}});}
}
