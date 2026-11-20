import { NextResponse } from "next/server";
import { getPublicStore } from "@/lib/server/database";
export const dynamic = "force-dynamic";
export async function GET(){
 const store=await getPublicStore();
 return NextResponse.json(store,{headers:{"Cache-Control":"no-store, private"}});
}
