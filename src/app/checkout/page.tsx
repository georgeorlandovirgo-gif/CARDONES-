'use client';
import {FormEvent,useState,useEffect} from 'react';
import Link from 'next/link';
import {ArrowRight,CheckCircle2,Copy,ShoppingBag} from 'lucide-react';
import {useStore} from '@/components/StoreProvider';
import {useCatalog} from '@/components/CatalogProvider';
import {useMerchant} from '@/components/MerchantProvider';
import {deliveryOptions,freeTowns,deliveryDetails} from '@/lib/delivery';
import {jmd} from '@/lib/money';
import {parishes,jamaicanPhone} from '@/lib/commerce';
type Receipt={shipping:{label:string;destination:string;town:string;courierCollect:boolean};reference:string;pricedSubtotalJmd:number;quoted:boolean;whatsappUrl:string|null;deliveryFeeJmd:number|null;fulfillment:string;paymentMethod:string;lines:Array<{name:string;size:string;quantity:number;unitPriceJmd:number|null}>};
export default function CheckoutPage(){
 const {lines,subtotal,hasUnpriced,clear}=useStore();const catalogue=useCatalog();const merchant=useMerchant();
 const [receipt,setReceipt]=useState<Receipt|null>(null),[demo,setDemo]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[upload,setUpload]=useState<File|null>(null);
 const [copyMessage,setCopyMessage]=useState('');
 const [shipping,setShipping]=useState({service:'free_dropoff',town:'Hopewell',destination:''});
 const [form,setForm]=useState({name:'',email:'',phone:'',parish:'Hanover',address:'',fulfillment:'delivery',notes:'',consent:false,website:'',paymentMethod:'quote_request'});
 const detail=lines.map(line=>({line,match:(()=>{const p=catalogue.find(x=>x.id===line.productId);return p?{product:p,variant:p.variants.find(v=>v.id===line.variantId)}:null;})()})).filter(x=>x.match?.variant);
 const test=process.env.NEXT_PUBLIC_STORE_DEMO==='1';
 const methods=[...(hasUnpriced?[{id:'quote_request',label:'Request a quotation'}]:[
  ...(merchant.payment.bankTransfer?[{id:'bank_transfer',label:'Bank transfer'}]:[]),
  ]),
  ...(merchant.payment.whatsapp?[{id:'whatsapp',label:'Order by WhatsApp'}]:[])];
 useEffect(()=>{setForm(f=>({...f,fulfillment:merchant.delivery?'delivery':'pickup',parish:merchant.availableParishes.includes(f.parish)?f.parish:merchant.availableParishes[0]||'St. Elizabeth'}));},[merchant.delivery,merchant.availableParishes]);
 useEffect(()=>{if(shipping.service==='free_dropoff')setForm(f=>({...f,parish:freeTowns[shipping.town as keyof typeof freeTowns]}));},[shipping.service,shipping.town]);
 const method=methods.some(x=>x.id===form.paymentMethod)?form.paymentMethod:(methods[0]?.id||'');
 async function submit(e:FormEvent){e.preventDefault();if(test){setDemo(true);clear();return;}if(!method)return;
  if(!jamaicanPhone(form.phone)){setError('Enter a valid Jamaican number, including 876 or 658.');return;}
  if(upload&&method==='bank_transfer'&&upload.size>5*1024*1024){setError('Receipt must be smaller than 5 MB.');return;}
  setLoading(true);setError('');try{
   deliveryDetails(shipping,form.parish,merchant.deliveryFeeJmd);
   const payload={...form,shipping,fulfillment:'delivery',paymentMethod:method,lines};const body=new FormData();body.set('order',JSON.stringify(payload));if(upload&&method==='bank_transfer')body.set('receipt',upload);
   const response=await fetch('/api/orders',{method:'POST',body});const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.message||'Request could not be saved.');
   setReceipt(result);clear();
  }catch(e){setError(e instanceof Error?e.message:'Unable to submit request.');}finally{setLoading(false);}
 }
 if(receipt||demo)return <section className="section"><div className="success-receipt"><CheckCircle2 size={52} color="#406e4e"/><h1>{demo?'Demo checkout completed':'Thank you for choosing Cardone’s.'}</h1>
 <p>{demo?'No real order, payment or customer details were transmitted.':`Your reference is ${receipt?.reference}. We have received your request, but payment has not been verified.`}</p>
 {receipt&&<div className="confirmation-summary"><h2>Your recorded request</h2>{receipt.lines.map((line,i)=><p key={i}>{line.quantity} × {line.name} · {line.size}<strong>{line.unitPriceJmd===null?'Quotation required':jmd(line.quantity*line.unitPriceJmd)}</strong></p>)}<p>Priced-item subtotal <strong>{jmd(receipt.pricedSubtotalJmd)}</strong></p><p>{receipt.shipping.label} · {receipt.shipping.town} · {receipt.shipping.destination}</p><p>{receipt.shipping.courierCollect?'Courier charge payable separately on delivery / collection. Amount added to this order':'Postage / drop-off'}: {receipt.deliveryFeeJmd===null?'Fee to be confirmed':jmd(receipt.deliveryFeeJmd)}</p>{!receipt.quoted&&<p>Amount payable to Cardone’s <strong>{jmd(receipt.pricedSubtotalJmd+(receipt.deliveryFeeJmd||0))}</strong></p>}<p>Dispatch Wednesday or Saturday, after payment verification. Your dispatch date will be confirmed.</p><p>{receipt.quoted?'Please wait for your full quotation before paying.':receipt.paymentMethod==='bank_transfer'?'Use your reference when transferring. Cardone’s will verify the funds independently.':'Cardone’s will contact you to confirm fulfilment and payment arrangements.'}</p></div>}
 {receipt?.whatsappUrl&&<a className="button button-dark" href={receipt.whatsappUrl} target="_blank" rel="noopener noreferrer">Continue order on WhatsApp <ArrowRight size={18}/></a>}
 <Link href="/shop" className="button button-outline-dark">Return to collection</Link></div></section>;
 return <section className="section checkout-section"><div className="container"><span className="eyebrow">YOUR CARDONE’S EXPERIENCE</span><h1>Checkout & enquiry</h1><p className="checkout-intro">{test?'DEMO ONLY — no orders or payments are accepted.':'Review your selection. Our team confirms final prices and delivery before processing.'}</p>
 {lines.length===0?<div className="success-receipt"><ShoppingBag size={42}/><h2>Your shopping bag is empty.</h2><Link className="button button-dark" href="/shop">Browse oils <ArrowRight size={17}/></Link></div>:
 <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
 <h2>Delivery options</h2><label className="form-field">Delivery service<select value={shipping.service} onChange={e=>setShipping({...shipping,service:e.target.value,destination:''})}>{deliveryOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
 {shipping.service==='free_dropoff'&&<label className="form-field">Free drop-off town<select value={shipping.town} onChange={e=>{setShipping({...shipping,town:e.target.value});setForm({...form,parish:freeTowns[e.target.value as keyof typeof freeTowns]});}}>{Object.entries(freeTowns).map(([town,parish])=><option key={town} value={town}>{town} — {parish}</option>)}</select></label>}
 {!test&&<label className="form-field">{shipping.service==='tara_address'?'Full delivery address':shipping.service==='tara_office'?'Preferred / nearest Tara office (town and branch)':shipping.service==='knutsford'?'Knutsford Express collection depot':shipping.service==='zip_mail'?'Zip Mail destination / collection post office':'Drop-off meeting point or address in your selected town'} *<input required minLength={3} maxLength={240} value={shipping.destination} onChange={e=>setShipping({...shipping,destination:e.target.value})}/></label>}
 <p className="status-note">{shipping.service==='free_dropoff'?'Drop-off is free in Hopewell, Sandy Bay and Lucea (Hanover), and Negril (Westmoreland). The meeting point will be confirmed.':shipping.service==='zip_mail'?(merchant.deliveryFeeJmd===null?'Zip Mail postage must be confirmed before checkout is available for this service.':`Zip Mail postage: ${jmd(merchant.deliveryFeeJmd)}. Pay this together with your products.`):'Pay the courier charge to Knutsford Express or Tara on delivery / collection. Product payment is due to Cardone’s before dispatch. Courier charges are confirmed separately.'}</p>
 <p className="status-note"><strong>Dispatch: Wednesdays and Saturdays.</strong> Orders must be received and payment verified before dispatch. These are shipment days, not guaranteed arrival dates; Cardone’s will confirm your dispatch date.</p>
 {test?<div className="status-note"><strong>Preview mode:</strong> Customer information is not needed or collected. Select the test checkout button to explore the final step.</div>:
 <><h2>Your details</h2><div className="form-grid">
 <label className="form-field">Full name *<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
 <label className="form-field">Telephone / WhatsApp *<input type="tel" inputMode="tel" autoComplete="tel" required minLength={10} maxLength={30} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
 <label className="form-field full">Email (optional)<input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
 <label className="form-field">Parish *<select value={form.parish} onChange={e=>setForm({...form,parish:e.target.value})}>{(shipping.service==='free_dropoff'?[freeTowns[shipping.town as keyof typeof freeTowns]]:merchant.availableParishes).map(p=><option value={p} key={p}>{p}</option>)}</select></label>
 <label className="form-field full">Notes (optional)<textarea maxLength={600} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div>
 <h2>Payment or enquiry</h2>{methods.length===0?<p className="status-note error">Checkout is not activated. The owner must enable a payment method in the store dashboard.</p>:
 <div className="payment-methods">{methods.map(m=><label className="payment-option" key={m.id}><input type="radio" name="payment" checked={method===m.id} onChange={()=>setForm({...form,paymentMethod:m.id})}/><span>{m.label}</span></label>)}</div>}
 {method==='bank_transfer'&&merchant.payment.bank&&<div className="bank-panel"><h3>Merchant bank details</h3>
 {Object.entries({Bank:merchant.payment.bank.name,'Account holder':merchant.payment.bank.holder,'Account number':merchant.payment.bank.account,Branch:merchant.payment.bank.branch,'Account type':merchant.payment.bank.type}).filter(([k,v])=>Boolean(v)).map(([k,v])=><div className="bank-field" key={k}><span>{k}</span><strong>{v}</strong><button type="button" aria-label={`Copy ${k}`} onClick={async()=>{try{await navigator.clipboard.writeText(v!);setCopyMessage(k+' copied.');}catch{setCopyMessage('Copy unavailable. Select the account text to copy it.');}}}><Copy size={17}/></button></div>)}
 <p role="status">{copyMessage}</p><p>{merchant.payment.bank.instructions||'Use your order reference on your transfer and retain proof of payment.'}</p>
 <label className="form-field">Optional payment receipt (JPG, PNG, WebP, PDF; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setUpload(e.target.files?.[0]||null)} /></label>
 <p className="cart-caveat">Uploading a receipt does not verify payment. Cardone’s will independently confirm cleared funds.</p></div>}
 {method==='cash'&&<p className="status-note">Payment will be arranged at delivery or pickup after order confirmation.</p>}
 {method==='whatsapp'&&<p className="status-note">After your order request is saved, the website will open a prepared WhatsApp message for your review.</p>}
 {method==='quote_request'&&<p className="status-note">Some products do not have confirmed prices. You will receive a quotation before making any payment.</p>}
 <label className="checkout-honeypot">Leave blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
 <label className="form-check"><input type="checkbox" checked={form.consent} required onChange={e=>setForm({...form,consent:e.target.checked})}/><span>I agree to be contacted about my request and understand no order is paid until independently confirmed.</span></label></>}
 {merchant.paused&&!test&&<p className="status-note">Ordering is currently paused. You can continue browsing the collection.</p>}{error&&<p role="alert" className="status-note error">{error}</p>}
 <button className="button button-dark full" type="submit" disabled={!test&&(!method||loading||merchant.paused||(shipping.service==='zip_mail'&&merchant.deliveryFeeJmd===null))}>{test?'Simulate checkout — no purchase':loading?'Recording request…':'Submit order / quote request'} <ArrowRight size={18}/></button>
 <p className="cart-caveat">{test?'No data is sent and no money is charged.':'All prices in Jamaican dollars. Products must be paid before dispatch. Zip Mail postage is prepaid; Knutsford and Tara courier charges are payable separately on receipt.'}</p>
 </form><aside className="checkout-card"><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2>
 {detail.map(({line,match})=><div className="checkout-item" key={line.productId+'-'+line.variantId}><div>{line.quantity} × {match!.product.name}<small>{match!.variant?.label}</small></div><strong>{match!.variant?.priceJmd===null?'Price on request':jmd((match!.variant?.priceJmd||0)*line.quantity)}</strong></div>)}
 <div className="checkout-total"><span>Priced-item subtotal</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p className="cart-caveat">Final total not available until all prices are confirmed.</p>}
 <p>{deliveryOptions.find(o=>o.id===shipping.service)?.label}</p><div className="checkout-total"><span>{shipping.service==='zip_mail'?'Prepaid Zip Mail postage':'Delivery charged by Cardone’s'}</span><strong>{shipping.service==='zip_mail'?(merchant.deliveryFeeJmd===null?'Awaiting rate':jmd(merchant.deliveryFeeJmd)):jmd(0)}</strong></div>{(shipping.service==='knutsford'||shipping.service.startsWith('tara_'))&&<p className="cart-caveat">Courier fee is extra, paid directly on delivery / collection.</p>}{!hasUnpriced&&(shipping.service!=='zip_mail'||merchant.deliveryFeeJmd!==null)&&<div className="checkout-total"><span>Amount payable to Cardone’s</span><strong>{jmd(subtotal+(shipping.service==='zip_mail'?(merchant.deliveryFeeJmd||0):0))}</strong></div>}</aside></div>}
 </div></section>;
}