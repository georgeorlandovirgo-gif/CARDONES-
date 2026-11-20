import { NextRequest, NextResponse } from "next/server";
import { checkOwner, loadSettings, publicAuthClient } from "@/lib/server/database";
import { settingsSchema } from "@/lib/store-validation";
export const dynamic = "force-dynamic";
const failed=(message:string,status:number)=>NextResponse.json({ok:false,message},{status,headers:{"Cache-Control":"no-store"}});
export async function GET(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return failed(owner.error || "Not authorised",owner.status || 403);
 const settings=await loadSettings();return NextResponse.json({ok:true,settings},{headers:{"Cache-Control":"no-store"}});
}
export async function PUT(req:NextRequest){
 const owner=await checkOwner(req);if("error" in owner)return failed(owner.error || "Not authorised",owner.status || 403);
 let raw:unknown;try{raw=await req.json();}catch{return failed("Invalid settings.",400);}
 const body=raw as {settings?:unknown;passwordConfirmation?:unknown};
 const parsed=settingsSchema.safeParse(body.settings);
 if(!parsed.success)return failed(parsed.error.issues[0]?.message||"Check the settings form.",400);
 const next=parsed.data;
 const previous=await loadSettings();
 const changed=Object.keys(next).filter(k=>JSON.stringify(next[k as keyof typeof next])!==JSON.stringify(previous[k as keyof typeof previous]));
 if(!changed.length)return NextResponse.json({ok:true,settings:previous,changed:[]});
 const banking=changed.some(k=>k.startsWith("bank_"));
 if(banking){
   if(typeof body.passwordConfirmation!=="string" || body.passwordConfirmation.length<8)return failed("Please confirm your password before changing bank details.",403);
   const client=publicAuthClient();
   if(!client || !owner.user.email)return failed("Reauthentication is unavailable. Banking details were not changed.",503);
   const check=await client.auth.signInWithPassword({email:owner.user.email,password:body.passwordConfirmation});
   if(check.error || check.data.user?.id!==owner.user.id)return failed("Password confirmation failed. No changes saved.",403);
 }
 // Audit the intended field changes before writing; values and bank account numbers are NEVER logged.
 const result=await owner.db.rpc("save_cardones_settings",{p_actor:owner.user.id,p_settings:next,p_changed:changed});
 if(result.error)return failed("Could not save settings.",503);
 return NextResponse.json({ok:true,settings:result.data,changed},{headers:{"Cache-Control":"no-store"}});
}
