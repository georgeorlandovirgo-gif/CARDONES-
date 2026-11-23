'use client';
import {ReceiptUpload} from './ReceiptUpload';
import {BotCheck} from './BotCheck';
import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import {jmd} from '@/lib/money';
import type {PublicMerchant} from './MerchantProvider';
export type Invoice={reference:string;token:string;issuedAt:string;customer:{name:string;phone:string;email:string;parish:string};bank:PublicMerchant['payment']['bank'];pricedSubtotalJmd:number;deliveryFeeJmd:number;shipping:{label:string;town:string;destination:string;courierCollect:boolean};lines:Array<{name:string;size:string;quantity:number;unitPriceJmd:number|null}>};
export function CheckoutInvoice({invoice,demo,onSubmitted}:{invoice:Invoice;demo:boolean;onSubmitted:()=>void}){
 const [stage,setStage]=useState<'payment'|'review'|'complete'>('payment');
 const [referenceReady,setReferenceReady]=useState(false);
 const [termsAccepted,setTermsAccepted]=useState(false);
 const [botToken,setBotToken]=useState(''),[botReset,setBotReset]=useState(0);
 const [file,setFile]=useState<File|null>(null),[transfer,setTransfer]=useState('');
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const totalJmd=invoice.pricedSubtotalJmd+invoice.deliveryFeeJmd;
 const proofAttached=Boolean(file&&file.size>0&&file.size<=5*1024*1024);
 const canPreview=termsAccepted&&proofAttached&&(demo||Boolean(referenceReady&&transfer.trim().length>=4&&botToken));

 function previewOrder(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  setMessage('');
  if(!termsAccepted){setMessage('Please accept the Terms and Conditions before reviewing your order.');return;}
  if(!proofAttached){setMessage('Upload valid proof of payment before you can preview your final order.');return;}
  if(!demo&&(!referenceReady||transfer.trim().length<4)){
   setMessage('Please confirm the bank transaction reference before previewing your order.');return;
  }
  if(!demo&&!botToken){setMessage('Complete the security check to review the order.');return;}
  setStage('review');
 }

 async function submitOrder(){
  if(stage!=='review'||busy)return;
  setMessage('');
  if(!termsAccepted){setStage('payment');setMessage('Please accept the Terms and Conditions before submitting.');return;}
  if(demo){
   if(!proofAttached){setStage('payment');setMessage('Attach a sample proof of payment before continuing.');return;}
   setStage('complete');
   setMessage('This is a demonstration only. No order was submitted or saved.');
   return;
  }
  if(!file||!referenceReady||transfer.trim().length<4||file.size>5*1024*1024){
   setStage('payment');
   setMessage('Review your uploaded receipt and verify the transaction ID before submitting.');
   return;
  }
  if(!botToken){setStage('payment');setMessage('Complete the security check again before submitting.');return;}
  setBusy(true);
  try{
   const body=new FormData();
   body.set('botToken',botToken);
   body.set('reference',invoice.reference);
   body.set('token',invoice.token);
   body.set('transferReference',transfer);
   body.set('receipt',file);
   body.set('termsAccepted','true');
   body.set('termsVersion','2026-11-23');
   const response=await fetch('/api/orders/payment',{method:'POST',body});
   const result=await response.json();
   if(!response.ok||!result.ok)throw Error(result.message||'Order submission failed.');
   setStage('complete');
   onSubmitted();
   setMessage(result.message||'Order submitted. Your payment is awaiting independent verification.');
  }catch(error){
   setStage('payment');
   setMessage(error instanceof Error?error.message:'Unable to submit. Please retry from the payment step.');
  }finally{
   setBusy(false);
   setBotToken('');
   setBotReset(n=>n+1);
  }
 }
 return <><section className="section" style={{display:stage==='review'?'none':undefined}}><div className="container invoice-layout"><article className="checkout-invoice"><span className="eyebrow">CARDONE’S PRODUCTS</span><h1>{demo?'Sample invoice':'Invoice'}</h1><p><strong>{invoice.reference}</strong><br/>{new Date(invoice.issuedAt).toLocaleDateString('en-JM',{timeZone:'America/Jamaica'})}</p><p><strong>{demo?'PREVIEW — NOT PAYABLE':stage==='complete'?'PROOF SUBMITTED — PAYMENT NOT YET VERIFIED':'AWAITING BANK TRANSFER'}</strong></p><h2>Customer details</h2><p className="invoice-address">{invoice.customer.name}<br/>Telephone: {invoice.customer.phone}<br/>Email: {invoice.customer.email}</p><table className="traffic-table"><thead><tr><th>Product / size</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>{invoice.lines.map((l,i)=><tr key={i}><td>{l.name}<br/>{l.size}</td><td>{l.quantity}</td><td>{jmd(l.unitPriceJmd||0)}</td><td>{jmd((l.unitPriceJmd||0)*l.quantity)}</td></tr>)}</tbody></table><p>Products: <strong>{jmd(invoice.pricedSubtotalJmd)}</strong></p><p>Prepaid postage / drop-off: <strong>{jmd(invoice.deliveryFeeJmd)}</strong></p><h2>Total payable: {jmd(invoice.pricedSubtotalJmd+invoice.deliveryFeeJmd)}</h2><p>Currency: Jamaican dollars (JMD).</p><h3>Delivery / collection</h3><p className="invoice-address">{invoice.shipping.label}<br/>{invoice.shipping.town}<br/>{invoice.shipping.destination}<br/>{invoice.customer.parish}</p>{invoice.shipping.courierCollect&&<p>Courier charges are additional and paid directly to the courier on delivery / collection.</p>}<p>Dispatch: Wednesday or Saturday, after cleared payment is independently verified. Arrival and dispatch arrangements will be confirmed.</p><section className="bank-panel" aria-labelledby="invoice-bank-heading"><h2 id="invoice-bank-heading">Pay by bank transfer to this account</h2><p>Payment must be made to the account shown below. Transfer the full invoice total, then upload your proof of payment and submit your order for processing.</p>{demo?<><p className="status-note"><strong>PREVIEW — account details will be added before launch. Do not make a payment.</strong></p>{['Bank name','Account holder','Account number','Branch','Account type'].map(label=><p key={label}>{label}: <strong>To be added by Cardone’s</strong></p>)}</>:invoice.bank?<>{Object.entries({'Bank name':invoice.bank.name,'Account holder':invoice.bank.holder,'Account number':invoice.bank.account,Branch:invoice.bank.branch,'Account type':invoice.bank.type}).filter(([,v])=>v).map(([k,v])=><p key={k}>{k}: <strong>{v}</strong></p>)}{invoice.bank.instructions&&<p>{invoice.bank.instructions}</p>}</>:<p>Bank details are not available. Contact Cardone’s before making any payment.</p>}<p>Amount to transfer: <strong>{jmd(invoice.pricedSubtotalJmd+invoice.deliveryFeeJmd)}</strong></p><p>Include invoice number <strong>{invoice.reference}</strong> in your transfer description. When uploading proof, enter the separate transaction ID issued by your bank.</p><p>Keep this page open. Upload your payment proof, select “Preview Final Order”, review your details, then choose “Submit Order”. Payment remains subject to verification.</p></section><button type="button" className="button button-outline-dark no-print" onClick={()=>window.print()}>Print / save invoice as PDF</button></article><aside className="invoice-payment no-print"><h2>{stage==='complete'?(demo?'Demo complete — no order submitted':'Order submitted — awaiting verification'):(demo?'Preview your final order':'Complete your order')}</h2>{stage==='complete'?<><p>{demo?'You have viewed the demo submission process. No actual order or payment information was sent, and your items remain in your shopping bag.':'Your order and proof of transfer have been received for review. Payment is NOT verified, and Cardone’s will not dispatch until it confirms funds in its bank account.'}</p><p><strong>Invoice reference:</strong> {invoice.reference}</p><Link href="/shop" className="button button-dark">Return to collection</Link></>:<><ol><li>Print or save your invoice.</li><li>Transfer the full invoice amount to the bank account shown on this invoice.</li><li>Upload your proof and confirm its transaction ID.</li><li>Preview your final order, then submit it on the following screen.</li></ol><p>Keep this page open while making the transfer. If you close it first, contact Cardone’s with your invoice reference to provide proof.</p>{demo&&<p className="status-note">Sample only. Do not transfer money or upload real payment information here.</p>}<form onSubmit={previewOrder}><ReceiptUpload demo={demo} busy={busy} onFile={setFile} onReference={setTransfer} onReady={setReferenceReady}/>{!demo&&<BotCheck action="payment_proof" onToken={setBotToken} reset={botReset}/>}<button className="button button-dark" disabled={!canPreview||busy} type="submit">Preview Final Order</button>{!proofAttached&&<p className="status-note" role="status">Upload proof of payment to enable the final order preview.</p>}<div className="terms-consent"><input id="invoice-terms-consent" type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} required/><label htmlFor="invoice-terms-consent">I acknowledge that Cardone’s oils are intended <strong>for external cosmetic use only</strong>, are <strong>not intended for ingestion or medical treatment</strong>, and agree to Cardone’s <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>.</label></div></form><p>This first step is a review only. Your order and payment proof are not submitted until you select <strong>Submit Order</strong> on the next screen. Payment must be independently verified before dispatch.</p></>}{message&&<p role="status">{message}</p>}</aside></div></section>
 {stage==='review'&&<section className="section checkout-review-section"><div className="container review-container">
  <span className="eyebrow">FINAL CHECK BEFORE SUBMISSION</span>
  <h1>Review &amp; submit your order.</h1>
  <p className="review-intro">Check the details below carefully. <strong>Nothing has been submitted by this review step.</strong> Only selecting <strong>Submit Order</strong> will send your order and payment proof to Cardone’s for verification.</p>
  {demo&&<p className="status-note"><strong>DEMO MODE:</strong> The final button will simulate submission. It will not create an order, transmit information or process a payment.</p>}
  <div className="review-layout">
   <article className="review-main">
    <div className="review-section"><span className="eyebrow">01 / YOUR DETAILS</span><h2>Customer &amp; delivery</h2>
     <p><strong>{invoice.customer.name}</strong><br/>Telephone: {invoice.customer.phone}<br/>Email: {invoice.customer.email}</p>
     <p><strong>{invoice.shipping.label}</strong><br/>{invoice.shipping.town}<br/>{invoice.shipping.destination}<br/>{invoice.customer.parish}</p>
     {invoice.shipping.courierCollect&&<p className="review-callout">Courier fees are payable directly to the courier on delivery or collection, in addition to the amount shown below.</p>}
    </div>
    <div className="review-section"><span className="eyebrow">02 / YOUR SELECTION</span><h2>Items in this order</h2>
     <div className="review-products">{invoice.lines.map((line,i)=><div className="review-product" key={i}><div><strong>{line.quantity} × {line.name}</strong><small>{line.size}</small></div><span>{jmd((line.unitPriceJmd||0)*line.quantity)}</span></div>)}</div>
     <div className="review-total-line"><span>Product subtotal</span><strong>{jmd(invoice.pricedSubtotalJmd)}</strong></div>
     <div className="review-total-line"><span>Prepaid postage / drop-off</span><strong>{jmd(invoice.deliveryFeeJmd)}</strong></div>
     <div className="review-total-line grand"><span>Total payable to Cardone’s</span><strong>{jmd(totalJmd)}</strong></div>
    </div>
   </article>
   <aside className="review-submit-card"><span className="eyebrow">03 / FINAL SUBMISSION</span><h2>Ready to submit?</h2>
    <p><strong>Invoice:</strong> {invoice.reference}</p>
    <p><strong>Payment method:</strong> Bank transfer (outside this website)</p>
    <p><strong>Proof of payment:</strong> {file?.name||'Demo — no real receipt required'}</p>
    <p><strong>Bank transaction ID:</strong> {transfer||'Demo only'}</p>
    <p className="review-callout"><strong>Important:</strong> Cardone’s has not yet verified your bank transfer. Submitting proof does not confirm payment or guarantee dispatch.</p>
    <p className="review-consent-note">You have acknowledged that Cardone’s oils are <strong>for external cosmetic use only</strong>, not intended for ingestion or medical treatment, and accepted the <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</Link>.</p>
    {message&&<p role="alert" className="status-note error">{message}</p>}
    <button type="button" className="button button-dark full" disabled={busy} onClick={()=>void submitOrder()}>{busy?'Submitting order…':demo?'Simulate Submit Order':'Submit Order'}</button>
    <button type="button" className="button button-outline-dark full review-back" disabled={busy} onClick={()=>{setMessage('');setStage('payment');}}>Back to invoice &amp; payment details</button>
   </aside>
  </div>
 </div></section>}</>;
}
