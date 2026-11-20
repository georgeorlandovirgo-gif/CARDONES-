"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, CheckCircle2, Clipboard, CreditCard, LockKeyhole, MessageCircle, ShoppingBag, UploadCloud } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { jmd } from "@/lib/money";
import { whatsappHref } from "@/lib/store-settings";
const parishes=["Kingston","St. Andrew","St. Catherine","Clarendon","Manchester","St. Elizabeth","Westmoreland","Hanover","St. James","Trelawny","St. Ann","St. Mary","Portland","St. Thomas"];
const DEMO=process.env.NEXT_PUBLIC_STORE_DEMO==="1";
const TURNSTILE=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||"";
type Receipt={reference:string;quoted:boolean;subtotalJmd:number;deliveryFeeJmd:number|null;receiptToken:string|null};
type Method="to_confirm"|"bank_transfer"|"cash_on_delivery"|"whatsapp";
const methodLabels:Record<Method,string>={
 to_confirm:"Request a quotation",bank_transfer:"Bank transfer",cash_on_delivery:"Cash at delivery / pickup",whatsapp:"Order with WhatsApp"
};
function Copy({value}:{value:string}) {
 const [copied,setCopied]=useState(false);
 return <button type="button" className="copy-detail" title="Copy to clipboard" onClick={async()=>{try{await navigator.clipboard.writeText(value);setCopied(true);}catch{setCopied(false);}}}><Clipboard size={15}/>{copied?"Copied":"Copy"}</button>;
}
export default function CheckoutPage(){
 const {lines,findItem,subtotal,hasUnpriced,settings,backendReady,clear}=useStore();
 const [loading,setLoading]=useState(false),[error,setError]=useState("");
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const [previewDone,setPreviewDone]=useState(false);
 const [file,setFile]=useState<File|null>(null);
 const [uploadStatus,setUploadStatus]=useState("");
 const [form,setForm]=useState({name:"",email:"",phone:"",parish:"St. Elizabeth",address:"",fulfillment:"delivery" as "delivery"|"pickup",paymentMethod:"to_confirm" as Method,notes:"",consent:false,website:""});
 const details=lines.map(line=>({line,item:findItem(line.productId,line.variantId)})).filter(row=>row.item);
 const methods:Array<{id:Method;name:string;description:string}>=[
  {id:"to_confirm",name:methodLabels.to_confirm,description:"We'll confirm availability and a final total before payment."},
  ...(settings.bank_enabled&&!hasUnpriced?[{id:"bank_transfer" as const,name:methodLabels.bank_transfer,description:"Transfer details and optional receipt upload."}]:[]),
  ...(settings.cod_enabled&&!hasUnpriced?[{id:"cash_on_delivery" as const,name:methodLabels.cash_on_delivery,description:"Pay according to your confirmed handover arrangement."}]:[]),
  ...(settings.whatsapp_enabled?[{id:"whatsapp" as const,name:methodLabels.whatsapp,description:"We'll prepare a WhatsApp message after saving your request."}]:[])
 ];
 useEffect(()=>{
  if(!settings.delivery_enabled&&settings.pickup_enabled&&form.fulfillment==="delivery")
   setForm(old=>({...old,fulfillment:"pickup"}));
  if(!methods.find(m=>m.id===form.paymentMethod))
   setForm(old=>({...old,paymentMethod:"to_confirm"}));
 },[settings.delivery_enabled,settings.pickup_enabled,settings.bank_enabled,settings.cod_enabled,settings.whatsapp_enabled,hasUnpriced,form.fulfillment,form.paymentMethod]);
 const deliveryFee=form.fulfillment==="delivery"?settings.delivery_fee_jmd:null;
 const canOrder=backendReady&&settings.store_open&&!DEMO;
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(loading||!lines.length||!canOrder)return;
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/orders",{
    method:"POST",headers:{"Content-Type":"application/json",...(TURNSTILE?{"x-turnstile-token":String(new FormData(e.currentTarget).get("cf-turnstile-response")||"")}: {})},
    body:JSON.stringify({...form,lines})
   });
   const data=await response.json();
   if(!response.ok||!data.ok)throw Error(data.message||"We could not save your order.");
   setReceipt(data as Receipt);clear();
  }catch(err){setError(err instanceof Error?err.message:"We could not submit the request.");}
  finally{setLoading(false);}
 }
 async function uploadReceipt(){
  if(!receipt?.receiptToken||!file)return;setLoading(true);setUploadStatus("");
  try{
   const data=new FormData();data.set("reference",receipt.reference);data.set("receiptToken",receipt.receiptToken);data.set("receipt",file);
   const response=await fetch("/api/orders/receipt",{method:"POST",body:data});
   const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.message||"Receipt upload failed.");
   setUploadStatus("Receipt received for manual review. It does not mean payment has been verified.");setFile(null);
   setReceipt({...receipt,receiptToken:null});
  }catch(err){setUploadStatus(err instanceof Error?err.message:"Upload unsuccessful.");}
  finally{setLoading(false);}
 }
 if(DEMO)return <section className="section checkout-section"><div className="container checkout-preview"><span className="eyebrow">TRY THE CARDONE’S SHOPPING JOURNEY</span><h1>Checkout preview</h1><p>Explore the shopping experience without entering personal details. This public demonstration does not create real orders or collect payments.</p>
  {previewDone?<div className="success-receipt"><CheckCircle2 size={48}/><h2>Preview complete.</h2><p>This was only a test. Nothing was purchased, sent or charged.</p><Link href="/shop" className="button button-dark">Back to the collection <ArrowRight size={16}/></Link></div>
  :details.length===0?<div className="success-receipt"><ShoppingBag size={42}/><h2>Nothing in your bag yet.</h2><Link href="/shop" className="button button-dark">Discover the oils <ArrowRight size={16}/></Link></div>
  :<div className="checkout-card"><h2>Your test order</h2>{details.map(({line,item})=><div className="checkout-item" key={line.productId+line.variantId}><div>{line.quantity} × {item!.product.name}<small>{item!.variant.label}</small></div><strong>{item!.variant.priceJmd===null?"Price on request":jmd(item!.variant.priceJmd*line.quantity)}</strong></div>)}<div className="checkout-total"><span>Priced items</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p>Unpriced products will need a quotation.</p>}<button className="button button-dark full" onClick={()=>{clear();setPreviewDone(true);}}>Simulate checkout <ArrowRight size={16}/></button><p className="cart-caveat">No customer data or payment details are collected.</p></div>}
 </div></section>;
 if(receipt){
  const message="Hello Cardone's Products. My order reference is "+receipt.reference+". I would like to confirm my order, pricing and delivery.";
  const link=settings.whatsapp_enabled?whatsappHref(settings.whatsapp_number,message):null;
  return <section className="section"><div className="success-receipt premium-receipt"><CheckCircle2 size={47}/><span className="eyebrow">REQUEST SAVED</span><h1>Thank you for choosing Cardone’s.</h1><p>Your order reference is <strong>{receipt.reference}</strong>.</p><p>We will confirm availability, any quotation items, delivery charges and payment arrangements. <strong>You have not been charged online.</strong></p>
   <div className="checkout-confirm-total"><span>Priced items</span><strong>{jmd(receipt.subtotalJmd)}</strong></div>
   {receipt.quoted&&<p>One or more items still require pricing before a payable total can be confirmed.</p>}
   {form.paymentMethod==="bank_transfer"&&receipt.receiptToken&&<div className="receipt-upload"><h2>Submitted a bank transfer?</h2><p>You may upload a receipt (JPG, PNG, WebP or PDF, 3 MB maximum). The merchant must verify the funds independently; an uploaded receipt is not proof of payment.</p><label className="manager-field"><span>Select receipt</span><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="button button-dark" type="button" disabled={!file||loading} onClick={uploadReceipt}><UploadCloud size={17}/> {loading?"Uploading…":"Submit receipt for verification"}</button></div>}
   {uploadStatus&&<p role="status">{uploadStatus}</p>}
   {link&&<a className="button button-outline-dark" href={link} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> Continue on WhatsApp</a>}
   <Link href="/shop" className="button button-dark">Explore more oils <ArrowRight size={16}/></Link>
  </div></section>;
 }
 return <section className="section checkout-section"><div className="container"><div className="checkout-heading"><span className="eyebrow">A PERSONAL SHOPPING EXPERIENCE</span><h1>Thoughtful checkout.</h1><p>Choose your oils, share delivery preferences and select the way you would like to complete your order. All prices are in Jamaican dollars.</p></div>
 {!details.length?<div className="success-receipt"><ShoppingBag size={42}/><h2>Your bag is empty.</h2><Link href="/shop" className="button button-dark">Discover the collection</Link></div>:
 <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
  <div className="checkout-step-header"><span>01</span><div><h2>Your contact details</h2><p>So we can respond to your order request.</p></div></div>
  <div className="form-grid">
   <label className="form-field">Full name *<input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
   <label className="form-field">Telephone / WhatsApp *<input placeholder="876-555-1234" required minLength={7} maxLength={30} autoComplete="tel" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
   <label className="form-field full">Email (optional)<input type="email" autoComplete="email" maxLength={150} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
   <label className="form-field">Parish *<select value={form.parish} onChange={e=>setForm({...form,parish:e.target.value})}>{parishes.map(p=><option key={p}>{p}</option>)}</select></label>
   <label className="form-field">Fulfilment method *<select value={form.fulfillment} onChange={e=>setForm({...form,fulfillment:e.target.value as "pickup"|"delivery"})}>{settings.delivery_enabled&&<option value="delivery">Delivery</option>}{settings.pickup_enabled&&<option value="pickup">Pickup</option>}</select></label>
   <label className="form-field full">Address / town{form.fulfillment==="delivery"?" *":""}<input autoComplete="street-address" maxLength={240} required={form.fulfillment==="delivery"} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
   <label className="form-field full">Order notes (optional)<textarea maxLength={600} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
   <label className="checkout-honeypot">Leave blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
  </div>
  <div className="checkout-step-header"><span>02</span><div><h2>How would you like to pay?</h2><p>Only payment methods currently enabled by the store appear here.</p></div></div>
  <div className="checkout-payment-options">{methods.map(method=><label key={method.id} className={"checkout-payment "+(form.paymentMethod===method.id?"selected":"")}><input type="radio" name="payment-method" value={method.id} checked={form.paymentMethod===method.id} onChange={()=>setForm({...form,paymentMethod:method.id})}/><span><strong>{method.name}</strong><small>{method.description}</small></span></label>)}</div>
  {form.paymentMethod==="bank_transfer"&&settings.bank_enabled&&<div className="bank-payment-panel"><div className="bank-panel-heading"><CreditCard size={20}/><h3>Bank transfer details</h3></div><p>Use the order reference provided after submission. Confirm the final amount with Cardone’s before sending funds.</p>
   {([["Bank name",settings.bank_name],["Account holder",settings.bank_holder],["Account number",settings.bank_account],["Branch",settings.bank_branch],["Account type",settings.bank_type]] as Array<[string,string]>).filter(x=>x[1]).map(([label,value])=><div className="bank-detail" key={label}><span>{label}<strong>{value}</strong></span><Copy value={value}/></div>)}
   {settings.bank_instructions&&<p>{settings.bank_instructions}</p>}
   <p className="bank-warning">Bank transfers are manually verified. A receipt does not automatically mark an order as paid.</p>
  </div>}
  {form.paymentMethod==="cash_on_delivery"&&<p className="status-note">Cash will be collected only in accordance with the delivery or pickup arrangements confirmed by Cardone’s.</p>}
  {form.paymentMethod==="whatsapp"&&<p className="status-note">Once your request is saved, you can open a prefilled message to Cardone’s Business WhatsApp.</p>}
  <label className="form-check"><input type="checkbox" required checked={form.consent} onChange={e=>setForm({...form,consent:e.target.checked})}/><span>I consent to being contacted about my order, and understand that the final price, availability and delivery arrangements must be confirmed before purchase. <Link className="inline-link" href="/policies#privacy">Privacy information</Link>.</span></label>
  {TURNSTILE&&<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/><div className="cf-turnstile" data-sitekey={TURNSTILE}/></>}
  {error&&<p className="status-note error" role="alert">{error}</p>}
  <button className="button button-dark full" type="submit" disabled={loading||!canOrder}>{loading?"Saving request…":canOrder?"Submit my order request":"Online requests are not yet activated"}<ArrowRight size={16}/></button>
  {!canOrder&&<p className="cart-caveat"><LockKeyhole size={15}/> The merchant must connect the production order service before this form accepts personal details.</p>}
  <p className="cart-caveat">Your bank card is never charged on this website. An order request is not a completed payment.</p>
 </form>
 <aside className="checkout-card"><span className="eyebrow">THE CARDONE’S BAG</span><h2>Your selection</h2>{details.map(({line,item})=><div key={line.productId+line.variantId} className="checkout-item"><div>{line.quantity} × {item!.product.name}<small>{item!.variant.label}</small></div><strong>{item!.variant.priceJmd===null?"Price on request":jmd(item!.variant.priceJmd*line.quantity)}</strong></div>)}
 <div className="checkout-total"><span>Priced items</span><strong>{jmd(subtotal)}</strong></div>
 {hasUnpriced&&<p className="status-note">Some items are not priced yet. Your final total will be quoted.</p>}
 <p className="cart-caveat">{form.fulfillment==="delivery"?(deliveryFee===null?"Delivery fee to be confirmed":"Estimated delivery fee: "+jmd(deliveryFee)):"Pickup arrangements confirmed with the merchant"}</p>
 {settings.delivery_text&&<p className="cart-caveat">{settings.delivery_text}</p>}
 </aside></div>}</div></section>;
}
