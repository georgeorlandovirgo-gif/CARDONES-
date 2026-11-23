// Contact details can be saved only when the customer opts in on their own device.
// Never persist passwords, payment proofs, delivery addresses, order details, or policy consent.
export const SAVED_CHECKOUT_CONTACT_KEY='cardones.checkout.contact.v1';
export type SavedCheckoutContact={name:string;email:string;phone:string};

export function serializeCheckoutContact(details:SavedCheckoutContact):string{
 return JSON.stringify({
  version:1,
  name:details.name.slice(0,100),
  email:details.email.slice(0,150),
  phone:details.phone.slice(0,30)
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
   ||typeof v.phone!=='string'||v.phone.length>30)return null;
  return {name:v.name,email:v.email,phone:v.phone};
 }catch{return null;}
}
