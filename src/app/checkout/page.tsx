'use client';
import {FormEvent,useState} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,Copy,ShoppingBag} from 'lucide-react';
import {useStore} from '@/components/StoreProvider';
import {useCatalog} from '@/components/CatalogProvider';
import {useMerchant} from '@/components/MerchantProvider';
import {jmd} from '@/lib/money';
const parishes=['Kingston','St. Andrew','St. Catherine','Clarendon','Manchester','St. Elizabeth','Westmoreland','Hanover','St. James','Trelawny','St. Ann','St. Mary','Portland','St. Thomas'];
type Receipt={reference:string;pricedSubtotalJmd:number;quoted:boolean;whatsappUrl:string|null};
export default function CheckoutPage(){
 const {lines,subtotal,hasUnpriced,clear}=useStore();const catalogue=useCatalog();const merchant=useMerchant();
 const [receipt,setReceipt]=useState<Receipt|null>(null),[demo,setDemo]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[upload,setUpload]=useState<File|null>(null);
 const [form,setForm]=useState({name:'',email:'',phone:'',parish:'St. Elizabeth',address:'',fulfillment:'delivery',notes:'',consent:false,website:'',paymentMethod:'quote_request'});
 const detail=lines.map(line=>({line,match:(()=>{const p=catalogue.find(x=>x.id===line.productId);return p?{product:p,variant:p.variants.find(v=>v.id===line.variantId)}:null;})()})).filter(x=>x.match?.variant);
 const test=process.env.NEXT_PUBLIC_STORE_DEMO==='1';
 const methods=[...(hasUnpriced?[{id:'quote_request',label:'Request a quotation'}]:[
  ...(merchant.payment.bankTransfer?[{id:'bank_transfer',label:'Bank transfer'}]:[]),
  ...(merchant.payment.cash?[{id:'cash',label:'Cash on delivery / pickup'}]:[]),
  ...(merchant.payment.whatsapp?[{id:'whatsapp',label:'Order by WhatsApp'}]:[])]),
  ...(!hasUnpriced&&merchant.payment.whatsapp?[{id:'whatsapp',label:'Order by WhatsApp'}]:[])].filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
 const method=methods.some(x=>x.id===form.paymentMethod)?form.paymentMethod:(methods[0]?.id||'');
 async function submit(e:FormEvent){e.preventDefault();if(test){setDemo(true);clear();return;}if(!method)return;
  setLoading(true);setError('');try{
   const payload={...form,paymentMethod:method,lines};const body=new FormData();body.set('order',JSON.stringify(payload));if(upload)body.set('receipt',upload);
   const response=await fetch('/api/orders',{method:'POST',body});const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.message||'Request could not be saved.');
   setReceipt(result);clear();
  }catch(e){setError(e instanceof Error?e.message:'Unable to submit request.');}finally{setLoading(false);}
 }
 if(receipt||demo)return <section className="section"><div className="success-receipt"><CheckCircle2 size={52} color="#406e4e"/><h1>{demo?'Demo checkout completed':'Thank you for choosing Cardone’s.'}</h1>
 <p>{demo?'No real order, payment or customer details were transmitted.':`Your reference is ${receipt?.reference}. We have received your request, but payment has not been verified.`}</p>
 {receipt?.whatsappUrl&&<a className="button button-dark" href={receipt.whatsappUrl} target="_blank" rel="noopener noreferrer">Continue order on WhatsApp <ArrowRight size={18}/></a>}
 <Link href="/shop" className="button button-outline-dark">Return to collection</Link></div></section>;
 return <section className="section checkout-section"><div className="container"><span className="eyebrow">YOUR CARDONE’S EXPERIENCE</span><h1>Checkout & enquiry</h1><p className="checkout-intro">{test?'DEMO ONLY — no orders or payments are accepted.':'Review your selection. Our team confirms final prices and delivery before processing.'}</p>
 {lines.length===0?<div className="success-receipt"><ShoppingBag size={42}/><h2>Your shopping bag is empty.</h2><Link className="button button-dark" href="/shop">Browse oils <ArrowRight size={17}/></Link></div>:
 <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
 {test?<div className="status-note"><strong>Preview mode:</strong> Customer information is not needed or collected. Select the test checkout button to explore the final step.</div>:
 <><h2>Your details</h2><div className="form-grid">
 <label className="form-field">Full name *<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
 <label className="form-field">Telephone / WhatsApp *<input autoComplete="tel" required minLength={7} maxLength={30} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
 <label className="form-field full">Email (optional)<input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
 <label className="form-field">Parish *<select value={form.parish} onChange={e=>setForm({...form,parish:e.target.value})}>{parishes.map(p=><option value={p} key={p}>{p}</option>)}</select></label>
 <label className="form-field">How would you like to receive it?<select value={form.fulfillment} onChange={e=>setForm({...form,fulfillment:e.target.value})}>
 {merchant.delivery&&<option value="delivery">Delivery — fee to be confirmed</option>}{merchant.pickup&&<option value="pickup">Arrange pickup</option>}</select></label>
 <label className="form-field full">Town / address (if applicable)<input maxLength={240} autoComplete="street-address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
 <label className="form-field full">Notes (optional)<textarea maxLength={600} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div>
 <h2>Payment or enquiry</h2>{methods.length===0?<p className="status-note error">Checkout is not activated. The owner must enable a payment method in the store dashboard.</p>:
 <div className="payment-methods">{methods.map(m=><label className="payment-option" key={m.id}><input type="radio" name="payment" checked={method===m.id} onChange={()=>setForm({...form,paymentMethod:m.id})}/><span>{m.label}</span></label>)}</div>}
 {method==='bank_transfer'&&merchant.payment.bank&&<div className="bank-panel"><h3>Merchant bank details</h3>
 {Object.entries({Bank:merchant.payment.bank.name,'Account holder':merchant.payment.bank.holder,'Account number':merchant.payment.bank.account,Branch:merchant.payment.bank.branch,'Account type':merchant.payment.bank.type}).filter(([k,v])=>Boolean(v)).map(([k,v])=><div className="bank-field" key={k}><span>{k}</span><strong>{v}</strong><button type="button" aria-label={`Copy ${k}`} onClick={()=>navigator.clipboard?.writeText(v!)}><Copy size={17}/></button></div>)}
 <p>{merchant.payment.bank.instructions||'Use your order reference on your transfer and retain proof of payment.'}</p>
 <label className="form-field">Optional payment receipt (JPG, PNG, WebP, PDF; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setUpload(e.target.files?.[0]||null)} /></label>
 <p className="cart-caveat">Uploading a receipt does not verify payment. Cardone’s will independently confirm cleared funds.</p></div>}
 {method==='cash'&&<p className="status-note">Payment will be arranged at delivery or pickup after order confirmation.</p>}
 {method==='whatsapp'&&<p className="status-note">After your order request is saved, the website will open a prepared WhatsApp message for your review.</p>}
 {method==='quote_request'&&<p className="status-note">Some products do not have confirmed prices. You will receive a quotation before making any payment.</p>}
 <label className="checkout-honeypot">Leave blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
 <label className="form-check"><input type="checkbox" checked={form.consent} required onChange={e=>setForm({...form,consent:e.target.checked})}/><span>I agree to be contacted about my request and understand no order is paid until independently confirmed.</span></label></>}
 {error&&<p role="alert" className="status-note error">{error}</p>}
 <button className="button button-dark full" type="submit" disabled={!test&&(!method||loading||merchant.paused)}>{test?'Simulate checkout — no purchase':loading?'Recording request…':'Submit order / quote request'} <ArrowRight size={18}/></button>
 <p className="cart-caveat">{test?'No data is sent and no money is charged.':'All prices in Jamaican dollars. Delivery fees and unpriced items must be confirmed separately.'}</p>
 </form><aside className="checkout-card"><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2>
 {detail.map(({line,match})=><div className="checkout-item" key={line.productId+'-'+line.variantId}><div>{line.quantity} × {match!.product.name}<small>{match!.variant?.label}</small></div><strong>{match!.variant?.priceJmd===null?'Price on request':jmd((match!.variant?.priceJmd||0)*line.quantity)}</strong></div>)}
 <div className="checkout-total"><span>Priced-item subtotal</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p className="cart-caveat">Final total not available until all prices are confirmed.</p>}
 <p className="cart-caveat">Delivery or pickup fees are not included unless confirmed.</p></aside></div>}
 </div></section>;
}