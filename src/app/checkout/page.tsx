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
  const [demoConfirmed,setDemoConfirmed]=useState(false);
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
  // GitHub Pages is a static demonstration. Never collect or transmit customer data in preview mode.
  if (process.env.NEXT_PUBLIC_STORE_DEMO === "1") return <section className="section checkout-section"><div className="container" style={{maxWidth:850}}>
    <span className="eyebrow">EXPERIENCE THE STORE</span>
    <h1>Checkout preview</h1>
    <p className="checkout-intro"><strong>Demonstration only.</strong> This test site does not take payments, accept orders, or collect customer details. Use the button below to test the checkout experience.</p>
    {demoConfirmed ? <div className="success-receipt"><CheckCircle2 size={44} color="#2f6546"/><h2>Demo checkout completed.</h2><p>No order was placed, no information was sent, and no payment was taken.</p><Link href="/shop" className="button button-dark">Explore the collection <ArrowRight size={17}/></Link></div>
     : !lines.length ? <div className="success-receipt"><ShoppingBag size={38}/><h2>Your bag is empty.</h2><p>Add some Cardone’s oils to test the shopping experience.</p><Link href="/shop" className="button button-dark">Explore the collection <ArrowRight size={17}/></Link></div>
     : <div className="checkout-card" style={{maxWidth:700,margin:"30px auto"}}>
      <span className="eyebrow">YOUR TEST SHOPPING BAG</span><h2>Order summary</h2>
      {details.map(({line,match}) => <div className="checkout-item" key={line.productId + "-" + line.variantId}><div>{line.quantity} × {match!.product.name}<small>{match!.variant.label}</small></div><strong>{match!.variant.priceJmd===null?"Price on request":jmd(match!.variant.priceJmd*line.quantity)}</strong></div>)}
      <div className="checkout-total"><span>Priced items</span><strong>{jmd(subtotal)}</strong></div>
      {hasUnpriced && <p className="status-note">Other items require a price quotation.</p>}
      <p className="cart-caveat">This is a test checkout. Delivery charges are not calculated and no purchase is created.</p>
      <button className="button button-dark full" type="button" onClick={() => {setDemoConfirmed(true);clear();}}>Simulate checkout — no purchase <ArrowRight size={16}/></button>
    </div>}
  </div></section>;
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