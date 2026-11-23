import {parishes} from './commerce';

// This feature is optional, browser-local and deliberately excludes payment or consent data.
export const SAVED_CHECKOUT_CONTACT_KEY='cardones.checkout.contact.v1';
export type SavedCheckoutContact={name:string;email:string;phone:string;parish:string};

export function serializeCheckoutContact(details:SavedCheckoutContact):string{
 return JSON.stringify({
  version:1,
  name:details.name.slice(0,100),
  email:details.email.slice(0,150),
  phone:details.phone.slice(0,30),
  parish:details.parish
 });
}

export function readCheckoutContact(raw:string|null):SavedCheckoutContact|null{
 if(!raw)return null;
 try{
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=='object')return null;
  const v=value as Record<string,unknown>;
  if(v.version!==1||typeof v.name!=='string'||v.name.length>100
   ||typeof v.email!=='string'||v.email.length>150
   ||typeof v.phone!=='string'||v.phone.length>30
   ||typeof v.parish!=='string'||!parishes.some(p=>p===v.parish))return null;
  return {name:v.name,email:v.email,phone:v.phone,parish:v.parish};
 }catch{return null;}
}
