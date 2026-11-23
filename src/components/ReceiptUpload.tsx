'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {readReceipt} from '@/lib/read-receipt';
export function ReceiptUpload({demo,busy,onFile,onReference,onReady}:{demo:boolean;busy:boolean;onFile:(file:File|null)=>void;onReference:(reference:string)=>void;onReady:(ready:boolean)=>void}){
 const [reference,setReference]=useState(''),[reading,setReading]=useState(false),[checked,setChecked]=useState(false),[message,setMessage]=useState('');
 const [selectedName,setSelectedName]=useState('');
 const fileInput=useRef<HTMLInputElement|null>(null);
 const inputId=useId();
 const active=useRef<AbortController|null>(null);
 useEffect(()=>()=>active.current?.abort(),[]);
 function edit(value:string){setReference(value);onReference(value);setChecked(false);onReady(false);}
 async function selected(file:File|null){
  active.current?.abort();const controller=new AbortController();active.current=controller;
  edit('');onFile(null);setSelectedName('');setMessage('');setReading(false);
  if(!file)return;
  if(file.size===0||file.size>5*1024*1024){setMessage('Choose a non-empty proof of payment file no larger than 5 MB.');return;}
  const acceptable=['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)||(!file.type&&/\.(jpe?g|png|webp|pdf)$/i.test(file.name));
  if(!acceptable){setMessage('Choose a JPG, PNG, WebP or PDF receipt.');return;}
  onFile(file);setSelectedName(file.name);
  if(demo){
   // A locally selected sample proves that the file-picker flow works in preview.
   // Never process real banking details in the public demo or run the heavy OCR reader here.
   edit('DEMO12345678');setChecked(true);onReady(true);
   setMessage('Sample proof attached for preview only. No file was uploaded to Cardone’s.');
   return;
  }
  setReading(true);setMessage('File selected. Reading your receipt… This can take a moment on a phone.');
  const timer=setTimeout(()=>{controller.abort();if(active.current===controller){setReading(false);setMessage('Automatic reading took too long. Enter the transaction ID below.');}},45000);
  try{
   const candidates=await readReceipt(file,controller.signal);if(controller.signal.aborted||active.current!==controller)return;
   if(candidates.length===1){edit(candidates[0]);setMessage('Transaction ID found. Check every character against your receipt before confirming.');}
   else setMessage(candidates.length?'More than one possible ID was found. Enter the bank transaction ID shown on your receipt.':'No clear transaction ID was found. Enter it from your receipt below.');
  }catch{if(!controller.signal.aborted&&active.current===controller)setMessage('We could not read this receipt. Enter the bank transaction ID below.');}
  finally{clearTimeout(timer);if(active.current===controller&&!controller.signal.aborted)setReading(false);}
 }
 function manual(){active.current?.abort();setReading(false);setMessage('Enter the transaction ID from your receipt below.');}
 async function sample(){
  const canvas=document.createElement('canvas');canvas.width=1300;canvas.height=400;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='white';ctx.fillRect(0,0,1300,400);ctx.fillStyle='black';ctx.font='40px Arial';
  ctx.fillText('SAMPLE ONLY - NOT A PAYMENT',40,90);ctx.fillText('Transaction ID: TEST12345678',40,180);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
  if(blob)await selected(new File([blob],'sample-receipt.png',{type:'image/png'}));
 }
 return <>
 <div className="receipt-file-picker">
  <label className="receipt-file-heading" htmlFor={inputId}>{demo?'Attach sample proof of payment *':'Upload proof of payment *'}</label>
  <input ref={fileInput} id={inputId} className="receipt-file-native" type="file" disabled={busy} required={!demo} accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>void selected(e.target.files?.[0]||null)}/>
  <div className="receipt-file-actions">
   <button type="button" className="button button-outline-dark receipt-file-button" disabled={busy} onClick={()=>fileInput.current?.click()}>Choose file</button>
   <span className="receipt-file-name" aria-live="polite">{selectedName?'Selected: '+selectedName:'No file selected'}</span>
  </div>
 </div>
 <p>JPG, PNG, WebP or PDF · maximum 5 MB. Receipt reading happens on your device. PDFs: first two pages only.</p>{demo&&<p className="status-note">Preview only — use a sample receipt or choose “Try reading a sample receipt” below. Do not upload real banking information.</p>}
 {demo&&<button type="button" className="button button-outline-dark" disabled={busy||reading} onClick={()=>void sample()}>Use a demo sample receipt</button>}
 {message&&<p role="status" aria-live="polite">{message}</p>}
 {reading&&<button type="button" className="text-button" onClick={manual}>Enter the number myself</button>}
 <label className="form-field">Bank transaction ID / receipt number *<input disabled={busy||reading} required={!demo} minLength={4} maxLength={100} value={reference} onChange={e=>edit(e.target.value)}/></label>
 <p>{demo?'The demo uses a test-only transaction reference and does not verify or transmit any payment.':'We will try to fill this from your upload. Correct it if needed. Use the bank-issued transaction ID, not your invoice number.'}</p>
 <label className="form-check"><input type="checkbox" required={!demo} disabled={busy||reading||!reference} checked={checked} onChange={e=>{setChecked(e.target.checked);onReady(e.target.checked);}}/><span>I checked that this transaction ID matches my receipt.</span></label>
 </>;
}
