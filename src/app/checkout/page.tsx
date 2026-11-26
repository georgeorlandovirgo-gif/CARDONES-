'use client';
import {BotCheck} from '@/components/BotCheck';
import {CheckoutInvoice,type Invoice} from '@/components/CheckoutInvoice';
import {FormEvent,useState,useEffect} from 'react';
import Link from 'next/link';
import {ArrowRight,ShoppingBag} from 'lucide-react';
import {useStore} from '@/components/StoreProvider';
import {useCatalog} from '@/components/CatalogProvider';
import {useMerchant} from '@/components/MerchantProvider';
import {collectionLocations,locationSources} from '@/lib/courier-locations';
import {deliveryOptions,freeTowns,deliveryDetails} from '@/lib/delivery';
import {jmd} from '@/lib/money';
import {jamaicanPhone} from '@/lib/commerce';
import {ZIP_MAIL_BASE_RATES_JMD,ZIP_MAIL_RATE_SOURCE,ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD} from '@/lib/zip-mail';
import {SAVED_CHECKOUT_CONTACT_KEY,readCheckoutContact,serializeCheckoutContact} from '@/lib/remember-checkout';
export default function CheckoutPage(){
 const {lines,subtotal,hasUnpriced,clear}=useStore();const catalogue=useCatalog();const merchant=useMerchant();
 const [botToken,setBotToken]=useState(''),[botReset,setBotReset]=useState(0);
 const [invoice,setInvoice]=useState<Invoice|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [shipping,setShipping]=useState({service:'free_dropoff',town:'Hopewell',destination:''});
 const [form,setForm]=useState({name:'',email:'',phone:'',parish:'Hanover',fulfillment:'delivery',notes:'',consent:false,website:''});
 const [rememberDetails,setRememberDetails]=useState(false);
 const [savedDetailsReady,setSavedDetailsReady]=useState(false);
 const [hasSavedDetails,setHasSavedDetails]=useState(false);
 const [saveNotice,setSaveNotice]=useState('');
 const detail=lines.map(line=>({line,match:(()=>{const p=catalogue.find(x=>x.id===line.productId);return p?{product:p,variant:p.variants.find(v=>v.id===line.variantId)}:null;})()})).filter(x=>x.match?.variant);
 const test=process.env.NEXT_PUBLIC_STORE_DEMO==='1';
 useEffect(()=>{setForm(f=>({...f,fulfillment:merchant.delivery?'delivery':'pickup',parish:merchant.availableParishes.includes(f.parish)?f.parish:merchant.availableParishes[0]||'St. Elizabeth'}));},[merchant.delivery,merchant.availableParishes]);
 useEffect(()=>{if(shipping.service==='free_dropoff')setForm(f=>({...f,parish:freeTowns[shipping.town as keyof typeof freeTowns]}));},[shipping.service,shipping.town]);
 // Saved contact details are optional and stored on this browser only.
 useEffect(()=>{
  try{
   const saved=readCheckoutContact(window.localStorage.getItem(SAVED_CHECKOUT_CONTACT_KEY));
   if(saved){
    setForm(current=>({...current,name:saved.name,email:saved.email,phone:saved.phone}));
    setRememberDetails(true);
    setHasSavedDetails(true);
   }
  }catch{/* Private browsing or blocked storage must not prevent checkout. */}
  setSavedDetailsReady(true);
 },[]);
 useEffect(()=>{
  if(!savedDetailsReady||!rememberDetails)return;
  try{
   window.localStorage.setItem(SAVED_CHECKOUT_CONTACT_KEY,
    serializeCheckoutContact({name:form.name,email:form.email,phone:form.phone}));
   setHasSavedDetails(true);
   setSaveNotice('');
  }catch{
   setRememberDetails(false);
   setSaveNotice('This browser does not allow saving details. You can still check out normally.');
  }
 },[savedDetailsReady,rememberDetails,form.name,form.email,form.phone]);
 function setRememberPreference(remember:boolean){
  setRememberDetails(remember);
  setSaveNotice('');
  if(!remember){
   try{window.localStorage.removeItem(SAVED_CHECKOUT_CONTACT_KEY);setHasSavedDetails(false);}
   catch{setSaveNotice('Please clear this site’s saved data in your browser settings.');}
  }
 }
 function forgetSavedDetails(){
  setRememberDetails(false);
  try{window.localStorage.removeItem(SAVED_CHECKOUT_CONTACT_KEY);setSaveNotice('Saved details cleared from this device.');setHasSavedDetails(false);}
  catch{setSaveNotice('Please clear this site’s saved data in your browser settings.');}
  setForm(current=>({...current,name:'',email:'',phone:''}));
 }
 async function submit(e:FormEvent){e.preventDefault();setError('');if(hasUnpriced){setError('Please contact Cardone’s to confirm prices before generating an invoice.');return;}if(!test&&!jamaicanPhone(form.phone)){setError('Enter a valid Jamaican telephone number.');return;}setLoading(true);try{const delivery=deliveryDetails(shipping,form.parish,merchant.deliveryFeeJmd);if(test){setInvoice({reference:'SAMPLE-NOT-PAYABLE',token:'',issuedAt:new Date().toISOString(),customer:{name:form.name,email:form.email,phone:form.phone,parish:form.parish},bank:null,pricedSubtotalJmd:subtotal,deliveryFeeJmd:delivery.fee,shipping:delivery,lines:detail.map(({line,match})=>({name:match!.product.name,size:match!.variant!.label,quantity:line.quantity,unitPriceJmd:match!.variant!.priceJmd}))});return;}const body=new FormData();body.set('botToken',botToken);body.set('order',JSON.stringify({...form,shipping,fulfillment:'delivery',paymentMethod:'bank_transfer',lines}));const r=await fetch('/api/orders',{method:'POST',body});const x=await r.json();if(!r.ok||!x.ok)throw Error(x.message||'Invoice could not be generated.');setInvoice(x);}catch(e){setError(e instanceof Error?e.message:'Unable to generate invoice.');}finally{setLoading(false);setBotToken('');setBotReset(n=>n+1);}}
 if(invoice)return <CheckoutInvoice invoice={invoice} demo={test} onSubmitted={clear}/>;
 return <section className="section checkout-section"><div className="container"><span className="eyebrow">YOUR CARDONE’S EXPERIENCE</span><h1>Checkout — bank transfer</h1><p className="checkout-intro">{test?'DEMO ONLY — no orders or payments are accepted.':'Enter your details and generate an invoice. Then transfer the amount through your bank, upload proof and submit your order.'}</p>
 {lines.length===0?<div className="success-receipt"><ShoppingBag size={42}/><h2>Your shopping bag is empty.</h2><Link className="button button-dark" href="/shop">Browse oils <ArrowRight size={17}/></Link></div>:
 <div className="checkout-layout"><form className="checkout-form" onSubmit={submit}>
 <h2>Delivery options</h2><label className="form-field">Delivery service<select value={shipping.service} onChange={e=>setShipping({...shipping,service:e.target.value,town:e.target.value==='free_dropoff'?'Hopewell':'',destination:''})}>{deliveryOptions.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
 {shipping.service==='free_dropoff'&&<label className="form-field">Free drop-off town<select value={shipping.town} onChange={e=>{setShipping({...shipping,town:e.target.value});setForm({...form,parish:freeTowns[e.target.value as keyof typeof freeTowns]});}}>{Object.entries(freeTowns).map(([town,parish])=><option key={town} value={town}>{town} — {parish}</option>)}</select></label>}
 {shipping.service==='zip_mail_door'&&<label className="form-field">Delivery parish *<select required value={form.parish} onChange={e=>setForm({...form,parish:e.target.value})}>{merchant.availableParishes.map(p=><option value={p} key={p}>{p}</option>)}</select></label>}
 {test&&<p className="status-note">Preview these fields using sample details only. No destination or address is sent or saved.</p>}
 {(shipping.service==='tara_address'||shipping.service==='zip_mail_door')&&<label className="form-field">Destination town / area *<input required={!test} minLength={2} maxLength={60} placeholder="Enter the town or area to send your package" value={shipping.town} onChange={e=>setShipping({...shipping,town:e.target.value})}/></label>}
 {collectionLocations(shipping.service).length>0?<><label className="form-field">Choose your collection location *<select required={!test} value={shipping.destination} onChange={e=>{const location=collectionLocations(shipping.service).find(x=>x.name===e.target.value);setShipping({...shipping,destination:e.target.value,town:location?.name||''});if(location?.parish)setForm({...form,parish:location.parish});}}><option value="" disabled>Select a collection location</option>{collectionLocations(shipping.service).map(x=><option key={x.name} value={x.name}>{x.name}{x.parish?` — ${x.parish}`:''}</option>)}</select></label><p className="cart-caveat">Locations follow the courier’s published list. Cardone’s will confirm availability before dispatch. <a href={locationSources[shipping.service as keyof typeof locationSources]} target="_blank" rel="noopener noreferrer">View official locations</a></p></>:(shipping.service==='tara_address'||shipping.service==='zip_mail_door')?<label className="form-field">Full home delivery address *<textarea required={!test} minLength={10} maxLength={240} autoComplete={test?'off':'street-address'} rows={3} placeholder="House / lot number, street, community and helpful directions" value={shipping.destination} onChange={e=>setShipping({...shipping,destination:e.target.value})}/></label>:<label className="form-field">Drop-off meeting point or address in your selected town *<input required={!test} minLength={3} maxLength={240} placeholder="Enter your preferred meeting point" value={shipping.destination} onChange={e=>setShipping({...shipping,destination:e.target.value})}/></label>}

 <p className="status-note">{shipping.service==='free_dropoff'?'Drop-off is free in Hopewell, Sandy Bay and Lucea (Hanover), and Negril (Westmoreland). The meeting point will be confirmed.':shipping.service==='zip_mail'?`Zip Mail Post Office to Post Office: ${jmd(ZIP_MAIL_BASE_RATES_JMD.post_to_post)} prepaid with your products for parcels up to 10 lb. Cardone’s drops the package off; you collect from your selected post office.`:shipping.service==='zip_mail_door'?`Zip Mail Post Office to Door: ${jmd(ZIP_MAIL_BASE_RATES_JMD.post_to_door)} prepaid with your products for parcels up to 10 lb. Cardone’s drops the package off and Jamaica Post delivers to your address, subject to delivery coverage confirmation.`:'Pay the courier charge to Knutsford Express or Tara on delivery / collection. Product payment is due to Cardone’s before dispatch. Courier charges are confirmed separately.'}</p>
 {(shipping.service==='zip_mail'||shipping.service==='zip_mail_door')&&<p className="zip-mail-subsidy"><strong>Cardone’s heavier-parcel contribution:</strong> For packages weighing more than 10 lb, Cardone’s covers additional Zip Mail postage up to <strong>{jmd(ZIP_MAIL_EXTRA_COVERAGE_MAX_JMD)}</strong> per order. If the excess charge exceeds that amount, we will confirm the remaining balance with you before requesting additional payment or dispatching. Final weight includes protective packaging and must be checked when packed. <a href={ZIP_MAIL_RATE_SOURCE} target="_blank" rel="noopener noreferrer">See Jamaica Post’s published rates</a>.</p>}
 <p className="status-note"><strong>Dispatch: Wednesdays and Saturdays.</strong> Orders must be received and payment verified before dispatch. These are shipment days, not guaranteed arrival dates; Cardone’s will confirm your dispatch date.</p>
 {test&&<p className="status-note">Use sample customer details only. This preview generates a sample invoice locally and does not send your details or accept payments. If you opt to remember contact details, the sample details are stored only in this browser.</p>}
 <><h2>Your details</h2><div className="form-grid">
 <label className="form-field">Full name *<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
 <label className="form-field">Telephone / WhatsApp *<input type="tel" inputMode="tel" autoComplete="tel" required minLength={10} maxLength={30} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
 <label className="form-field full">Email *<input required maxLength={150} type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
 <label className="form-field full">Notes (optional)<textarea maxLength={600} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div>
 <div className="remember-checkout">
  <label className="form-check">
   <input type="checkbox" checked={rememberDetails} onChange={e=>setRememberPreference(e.target.checked)}/>
   <span><strong>Remember my details on this device</strong><small>Automatically fill in my name, telephone number and email next time. Optional; stored only in this browser, not in a customer account.</small></span>
  </label>
  {hasSavedDetails&&<button type="button" className="remember-forget" onClick={forgetSavedDetails}>Forget my saved details</button>}
  {saveNotice&&<p className="remember-message" role="status">{saveNotice}</p>}
  <p className="remember-privacy">Avoid saving personal details on a shared device. Payment proof, delivery instructions and consent choices are never remembered.</p>
 </div>
 <h2>Pay by bank transfer</h2><p>No online payment is taken. Generate your invoice first to see the reference, amount and bank details. After transferring, upload your proof on the invoice screen and submit your order.</p>{!test&&!merchant.payment.bankTransfer&&<p className="status-note">Bank-transfer invoicing is not available yet. Please contact Cardone’s.</p>}
 <label className="checkout-honeypot">Leave blank<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
 <label className="form-check"><input type="checkbox" checked={form.consent} required onChange={e=>setForm({...form,consent:e.target.checked})}/><span>I agree to be contacted about my request and understand no order is paid until independently confirmed.</span></label></>
 {merchant.paused&&!test&&<p className="status-note">Ordering is currently paused. You can continue browsing the collection.</p>}{error&&<p role="alert" className="status-note error">{error}</p>}
 {!test&&<BotCheck action="invoice" onToken={setBotToken} reset={botReset}/>}
 <button className="button button-dark full" type="submit" disabled={loading||(!test&&(!botToken||!merchant.payment.bankTransfer||merchant.paused||hasUnpriced))}>{loading?'Generating invoice…':test?'Generate sample invoice':'Generate invoice'} <ArrowRight size={18}/></button>
 <p className="cart-caveat">{test?'No data is sent and no money is charged.':'All prices in Jamaican dollars. Products must be paid before dispatch. Zip Mail postage is prepaid; Knutsford and Tara courier charges are payable separately on receipt.'}</p>
 </form><aside className="checkout-card"><span className="eyebrow">YOUR SELECTION</span><h2>Order summary</h2>
 {detail.map(({line,match})=><div className="checkout-item" key={line.productId+'-'+line.variantId}><div>{line.quantity} × {match!.product.name}<small>{match!.variant?.label}</small></div><strong>{match!.variant?.priceJmd===null?'Price on request':jmd((match!.variant?.priceJmd||0)*line.quantity)}</strong></div>)}
 <div className="checkout-total"><span>Priced-item subtotal</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p className="cart-caveat">Final total not available until all prices are confirmed.</p>}
 <p>{deliveryOptions.find(o=>o.id===shipping.service)?.label}</p>{shipping.town&&<p>Destination: {shipping.town}</p>}{shipping.destination&&<p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{shipping.destination}</p>}<div className="checkout-total"><span>{shipping.service.startsWith('zip_mail')?'Prepaid Zip Mail postage':'Delivery charged by Cardone’s'}</span><strong>{shipping.service==='zip_mail'?jmd(ZIP_MAIL_BASE_RATES_JMD.post_to_post):shipping.service==='zip_mail_door'?jmd(ZIP_MAIL_BASE_RATES_JMD.post_to_door):jmd(0)}</strong></div>{(shipping.service==='knutsford'||shipping.service.startsWith('tara_'))&&<p className="cart-caveat">Courier fee is extra, paid directly on delivery / collection.</p>}{(shipping.service==='zip_mail'||shipping.service==='zip_mail_door')&&<p className="cart-caveat">Rates are for up to 10 lb, with Cardone’s dropping off at the post office. Cardone’s pays up to J$1,500 of excess-weight postage; any remaining surcharge requires your approval before dispatch. Door delivery availability is subject to confirmation.</p>}{!hasUnpriced&&<div className="checkout-total"><span>Amount payable to Cardone’s</span><strong>{jmd(subtotal+(shipping.service==='zip_mail'?ZIP_MAIL_BASE_RATES_JMD.post_to_post:shipping.service==='zip_mail_door'?ZIP_MAIL_BASE_RATES_JMD.post_to_door:0))}</strong></div>}</aside></div>}
 </div></section>;
}