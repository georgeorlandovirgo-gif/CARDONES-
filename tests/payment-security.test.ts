import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import sharp from 'sharp';
import {prepareProof,limitedForm} from '../src/lib/server/upload';
import {verifyBot} from '../src/lib/server/bot-check';
import type {NextRequest} from 'next/server';

test('Images must decode, metadata is removed, and streaming requests enforce size caps',async()=>{
 await assert.rejects(prepareProof(Buffer.from([255,216,255,1,2,3])));
 const png=await sharp({create:{width:100,height:100,channels:3,background:'white'}}).withMetadata().png().toBuffer();
 const proof=await prepareProof(png);assert.equal(proof.mime,'image/png');assert.equal((await sharp(proof.bytes).metadata()).exif,undefined);
 const req=new Request('http://localhost',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=test'},body:'x'.repeat(101)});
 await assert.rejects(limitedForm(req as unknown as NextRequest,100),/too large/);
});

test('Bot validation fails closed on missing configuration, replay rejection, wrong action or hostname',async()=>{
 const savedFetch=globalThis.fetch,secret=process.env.TURNSTILE_SECRET_KEY,host=process.env.TURNSTILE_HOSTNAME;
 try{
  delete process.env.TURNSTILE_SECRET_KEY;await assert.rejects(verifyBot('token','invoice'),/not configured/);
  process.env.TURNSTILE_SECRET_KEY='test-secret';process.env.TURNSTILE_HOSTNAME='store.example';
  await assert.rejects(verifyBot('','invoice'),/Complete/);
  for(const response of [{success:false,'error-codes':['timeout-or-duplicate']},{success:true,hostname:'attacker.example',action:'invoice'},{success:true,hostname:'store.example',action:'payment_proof'}]){
   globalThis.fetch=async()=>Response.json(response);await assert.rejects(verifyBot('token','invoice'),/expired or failed/);
  }
  globalThis.fetch=async()=>Response.json({success:true,hostname:'store.example',action:'invoice'});await verifyBot('token','invoice');
  globalThis.fetch=async()=>{throw Error('network');};await assert.rejects(verifyBot('token','invoice'),/expired or failed/);
 }finally{globalThis.fetch=savedFetch;if(secret===undefined)delete process.env.TURNSTILE_SECRET_KEY;else process.env.TURNSTILE_SECRET_KEY=secret;if(host===undefined)delete process.env.TURNSTILE_HOSTNAME;else process.env.TURNSTILE_HOSTNAME=host;}
});

test('Duplicate receipts stay unpaid; bank verification is atomic, audited, and cannot reuse a credit',async()=>{
 const db=new PGlite();
 try{
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
  for(const file of ['001_orders.sql','002_store_management.sql','003_atomic_commerce.sql','004_testimonials.sql','006_delivery.sql','007_invoice_checkout.sql','008_payment_safeguards.sql']){
   await db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''));
  }
  const actor='00000000-0000-4000-8000-000000000001',hash='a'.repeat(64);
  const make=async(ref:string)=>(await db.query<{id:string}>("INSERT INTO store_orders(reference,customer_name,phone,parish,fulfillment,lines,has_unpriced,payment_method,shipping_service,delivery_fee_jmd,priced_subtotal_jmd,invoice_upload_hash,status) VALUES($1,'Fixture','18765550100','Hanover','delivery','[]',false,'bank_transfer','free_dropoff',0,1800,'access','awaiting_payment') RETURNING id",[ref])).rows[0].id;
  assert.equal((await db.query<{ok:boolean}>('SELECT consume_cardones_bot_token($1) ok',[hash])).rows[0].ok,true);
  assert.equal((await db.query<{ok:boolean}>('SELECT consume_cardones_bot_token($1) ok',[hash])).rows[0].ok,false);
  const first=await make('TEST-A'),second=await make('TEST-B');
  const submit=(ref:string)=>db.query<{ok:boolean}>('SELECT submit_cardones_invoice($1,$2,$3,$4,$5) ok',[ref,'access','private/receipt.png','TX-1000',hash]);
  await assert.rejects(db.query('SELECT submit_cardones_invoice($1,$2,$3,$4,$5)',['TEST-A','wrong','private/receipt.png','TX-1000',hash]));
  await Promise.all([submit('TEST-A'),submit('TEST-B')]);
  const rows=(await db.query<{id:string;review_flags:string[];status:string;payment_verified_at:unknown}>('SELECT id,review_flags,status,payment_verified_at FROM store_orders ORDER BY reference')).rows;
  assert.equal(rows[0].review_flags.length,0);assert.equal(rows[1].review_flags.length,2);
  for(const r of rows){assert.equal(r.status,'payment_submitted');assert.equal(r.payment_verified_at,null);}
  assert.equal((await submit('TEST-A')).rows[0].ok,false);
  for(const status of ['payment_verified','processing','confirmed','dispatched','fulfilled'])await assert.rejects(db.query('SELECT update_cardones_order($1,$2,$3)',[actor,first,status]));
  const verify=(id:string,credit:string,amount:number,note='')=>db.query('SELECT verify_cardones_bank_credit($1,$2,$3,$4,$5)',[actor,id,credit,amount,note]);
  await assert.rejects(verify(first,'CREDIT-1000',1799));
  await verify(first,'CREDIT-1000',1800);
  await assert.rejects(verify(second,'CREDIT-1000',1800,'Matched a separate credit in bank statement'));
  await assert.rejects(verify(second,'CREDIT-2000',1800));
  assert.equal((await db.query<{bank_credit_reference:unknown}>('SELECT bank_credit_reference FROM store_orders WHERE id=$1',[second])).rows[0].bank_credit_reference,null);
  await verify(second,'CREDIT-2000',1800,'Matched a separate cleared credit in bank statement');
  assert.equal((await db.query<{n:number}>("SELECT count(*)::int n FROM store_admin_audit WHERE event='bank_credit_independently_checked'")).rows[0].n,2);
  for(const role of ['anon','authenticated']){
   await db.exec('SET ROLE '+role);
   await assert.rejects(verify(first,'CREDIT-9999',1800));await assert.rejects(submit('TEST-A'));
   await assert.rejects(db.query('SELECT proof_sha256 FROM store_orders'));
   await db.exec('RESET ROLE');
  }
 }finally{await db.close();}
});
