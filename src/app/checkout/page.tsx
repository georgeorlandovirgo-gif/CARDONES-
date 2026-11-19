"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { variantById } from "@/lib/catalog";
import { jmd } from "@/lib/money";
const parishes = ["Kingston", "St. Andrew", "St. Catherine", "Clarendon", "Manchester", "St. Elizabeth", "Westmoreland", "Hanover", "St. James", "Trelawny", "St. Ann", "St. Mary", "Portland", "St. Thomas"];
type Receipt = { reference: string; quoted: boolean; pricedSubtotalJmd: number };
export default function CheckoutPage() {
  const { lines, subtotal, hasUnpriced, clear } = useStore();
  const [loading,setLoading]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState<Receipt|null>(null);
  const [form,setForm]=useState({ name:"", email:"", phone:"", parish:"St. Elizabeth", address:"", fulfillment:"delivery", notes:"", consent:false, website:"" });
  const details=lines.map(line=>({line,match:variantById(line.productId,line.variantId)})).filter(x=>x.match);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); if(loading||!lines.length)return;
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/orders",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, lines}) });
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.message||"Unable to save your request.");
      setReceipt({reference:data.reference,quoted:data.quoted,pricedSubtotalJmd:data.pricedSubtotalJmd});clear();
    }catch(e){setError(e instanceof Error?e.message:"The request could not be submitted.");}
    finally{setLoading(false);}
  }
  if(receipt)return <section className="section"><div className="success-receipt"><CheckCircle2 size={48} color="#2f6546"/><span className="eyebrow" style={{display:"block",marginTop:18}}>REQUEST RECEIVED</span><h1>Thank you for choosing Cardone’s.</h1><p>Your reference is <strong>{receipt.reference}</strong></p><p>We have saved your request. Our team will confirm product availability, any unpriced items, pickup or delivery fees, and payment instructions before processing the order. <strong>You have not been charged.</strong></p><Link href="/shop" className="button button-dark">Continue exploring <ArrowRight size={17}/></Link></div></section>;
  return <section className="section checkout-section"><div className="container"><span className="eyebrow">A PERSONAL SHOPPING EXPERIENCE</span><h1>Request checkout</h1><p className="checkout-intro">We'll personally confirm your order and final total, including delivery or pickup arrangements. This is a request, not an online card payment.</p>{!lines.length?<div className="success-receipt"><ShoppingBag size={41} strokeWidth={1}/><h2>Your bag is empty.</h2><p>Discover the oils that suit your daily ritual.</p><Link href="/shop" className="button button-dark">Shop the collection <ArrowRight size={17}/></Link></div>:<div className="checkout-layout"><form className="checkout-form" onSubmit={submit}><h2>Your details</h2><div className="form-grid">
    <label className="form-field">Full name *<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
    <label className="form-field">Telephone / WhatsApp *<input autoComplete="tel" required minLength={7} maxLength={30} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
    <label className="form-field full">Email address (optional)<input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    <label className="form-field">Parish *<select value={form.parish} onChange={e=>setForm({...form,parish:e.target.value})}>{parishes.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
    <label className="form-field">How would you like to receive it? *<select value={form.fulfillment} onChange={e=>setForm({...form,fulfillment:e.target.value})}><option value="delivery">Delivery quotation</option><option value="pickup">Arrange pickup</option></select></label>
    <label className="form-field full">Delivery address / town (if relevant)<input autoComplete="street-address" maxLength={240} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
    <label className="form-field full">Order notes (optional)<textarea maxLength={600} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any questions about your order?"/></label>
    <label className="checkout-honeypot">Leave this blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
  </div><label className="form-check"><input type="checkbox" required checked={form.consent} onChange={e=>setForm({...form,consent:e.target.checked})}/><span>I agree to be contacted about my order and understand the final price, delivery arrangements and payment instructions will be confirmed before purchase. <Link href="/policies#privacy" className="inline-link">Privacy policy</Link>.</span></label>
  {error&&<p role="alert" className="status-note error">{error}</p>}
  <button className="button button-dark full" type="submit" disabled={loading}>{loading?"Sending your request…":"Submit order / quotation request"}<ArrowRight size={16}/></button><p className="cart-caveat">No money is collected on this website. A request confirmation is not a completed paid order.</p>
  </form><aside className="checkout-card"><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2>{details.map(({line,match})=><div className="checkout-item" key={`${line.productId}-${line.variantId}`}><div>{line.quantity} × {match!.product.name}<small>{match!.variant.label}</small></div><strong>{match!.variant.priceJmd===null?"Quotation":jmd(match!.variant.priceJmd*line.quantity)}</strong></div>)}<div className="checkout-total"><span>Priced items</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p className="status-note">Some items need a price quotation. No final total is available yet.</p>}<p className="cart-caveat">Shipping, delivery and pickup costs are confirmed separately. Currently serving Jamaica.</p></aside></div>}</div></section>;
}