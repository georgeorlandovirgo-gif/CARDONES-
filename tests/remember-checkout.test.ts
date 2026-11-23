import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SAVED_CHECKOUT_CONTACT_KEY,readCheckoutContact,serializeCheckoutContact} from '../src/lib/remember-checkout';

test('saved customer details only include name, email and telephone',()=>{
 const json=serializeCheckoutContact({name:'Example Customer',email:'example@example.test',phone:'8765550123'});
 assert.equal(SAVED_CHECKOUT_CONTACT_KEY,'cardones.checkout.contact.v1');
 assert.deepEqual(JSON.parse(json),{version:1,name:'Example Customer',email:'example@example.test',phone:'8765550123'});
 assert.deepEqual(readCheckoutContact(json),{name:'Example Customer',email:'example@example.test',phone:'8765550123'});
 assert.ok(!json.includes('parish'));
 assert.ok(!json.includes('address'));
 assert.ok(!json.includes('consent'));
});

test('malformed, stale and excessively large saved records are ignored',()=>{
 for(const value of [null,'','not json','[]','{"version":2,"name":"X","email":"e","phone":"1"}','{"version":1,"name":7,"email":"","phone":""}']){
  assert.equal(readCheckoutContact(value),null);
 }
 assert.equal(readCheckoutContact(JSON.stringify({version:1,name:'a'.repeat(101),email:'a',phone:'1'})),null);
 assert.equal(readCheckoutContact(JSON.stringify({version:1,name:'a',email:'a'.repeat(151),phone:'1'})),null);
});
