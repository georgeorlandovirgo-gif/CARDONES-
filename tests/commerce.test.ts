import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {products} from '../src/lib/catalog';
import {jamaicanPhone,parishes} from '../src/lib/commerce';
import {cleanCart} from '../src/lib/cart';
test('Jamaican phone normalization rejects invalid and mixed-text input',()=>{
 assert.equal(jamaicanPhone('(876) 555-0100'),'18765550100');assert.equal(jamaicanPhone('+1 658 555 0100'),'16585550100');
 for(const value of ['5550100','+1 212 555 0100','call8765550100','87655501000'])assert.equal(jamaicanPhone(value),null);
 assert.equal(parishes.length,14);
});
test('Cart rejects corrupt quantities and preserves unpriced/coming-soon catalogue truth',()=>{
 assert.deepEqual(cleanCart([{productId:'castor',variantId:'castor-148',quantity:-1},{productId:'castor',variantId:'castor-148',quantity:2}]),[{productId:'castor',variantId:'castor-148',quantity:2}]);
 assert.equal(products.find(p=>p.id==='castor')!.variants[0].priceJmd,1800);
 assert.ok(products.filter(p=>p.id!=='castor').every(p=>p.variants.every(v=>v.priceJmd===null)));
 assert.ok(products.find(p=>p.id==='avocado')!.variants.every(v=>!v.available));
});
test('PostgreSQL migrations, atomic saves, rollback, throttling and access grants',async()=>{
 const db=new PGlite();
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const file of ['001_orders.sql','002_store_management.sql','003_atomic_commerce.sql']){
  const sql=(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;','');
  await db.exec(sql);
 }
 const actor='00000000-0000-4000-8000-000000000001';
 const seed=products.map((p,i)=>({...p,featured:!!p.featured,active:true,sortOrder:i}));
 await db.query('SELECT seed_cardones_catalogue($1,$2)',[actor,JSON.stringify(seed)]);
 assert.equal((await db.query<{n:number}>('SELECT count(*)::int n FROM store_products')).rows[0].n,7);
 await assert.rejects(db.query('SELECT seed_cardones_catalogue($1,$2)',[actor,JSON.stringify(seed)]));
 await db.query('SELECT save_cardones_merchant($1,$2,$3)',[actor,JSON.stringify({bank_name:'Test bank',bank_account:'TEST-ONLY',bank_holder:'Fixture',store_paused:true}),['bank_name','bank_account','bank_holder']]);
 const stored=await db.query<{bank_name:string;store_paused:boolean}>('SELECT bank_name,store_paused FROM store_settings');assert.equal(stored.rows[0].bank_name,'Test bank');assert.equal(stored.rows[0].store_paused,true);
 const audit=await db.query<{after_data:unknown}>('SELECT after_data FROM store_admin_audit');assert.ok(!JSON.stringify(audit.rows).includes('TEST-ONLY'));
 const invalid={...seed[0],name:'SHOULD ROLL BACK',variants:[{...seed[0].variants[0],id:'jojoba-60'}]};
 await assert.rejects(db.query('SELECT save_cardones_catalogue_product($1,$2)',[actor,JSON.stringify(invalid)]));
 assert.equal((await db.query<{name:string}>("SELECT name FROM store_products WHERE id='castor'")).rows[0].name,'Castor Oil');
 for(let i=0;i<6;i++)assert.equal((await db.query<{ok:boolean}>('SELECT take_cardones_order_slot($1) ok',['a'.repeat(64)])).rows[0].ok,true);
 assert.equal((await db.query<{ok:boolean}>('SELECT take_cardones_order_slot($1) ok',['a'.repeat(64)])).rows[0].ok,false);
 await db.exec('SET ROLE anon');await assert.rejects(db.query('SELECT * FROM store_settings'));await assert.rejects(db.query('SELECT save_cardones_merchant($1,$2,$3)',[actor,'{}',[]]));await db.exec('RESET ROLE');
 await db.close();
});
