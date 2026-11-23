'use client';
import {useEffect,useRef,useState} from 'react';
import {readReceipt} from '@/lib/read-receipt';
export function ReceiptUpload({demo,busy,onFile,onReference,onReady}:{demo:boolean;busy:boolean;onFile:(file:File|null)=>void;onReference:(reference:string)=>void;onReady:(ready:boolean)=>void}){
 const [reference,setReference]=useState(''),[reading,setReading]=useState(false),[checked,setChecked]=useState(false),[message,setMessage]=useState('');
 const active=useRef<AbortController|null>(null);
 useEffect(()=>()=>active.current?.abort(),[]);
 function edit(value:string){setReference(value);onReference(value);setChecked(false);onReady(false);}
 async function selected(file:File|null){
  active.current?.abort();const controller=new AbortController();active.current=controller;
  edit('');onFile(file);setMessage('');setReading(false);if(!file)return;
  if(file.size===0||file.size>5*1024*1024){setMessage('Choose a non-empty proof of payment file no larger than 5 MB.');onFile(null);return;}
  setReading(true);setMessage('Reading your receipt… This can take a moment on a phone.');
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
 <label className="form-field">{demo?'Upload sample proof of payment *':'Upload proof of payment *'}<input type="file" disabled={busy} required={!demo} accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>void selected(e.target.files?.[0]||null)}/></label>
 <p>JPG, PNG, WebP or PDF · maximum 5 MB. Receipt reading happens on your device. PDFs: first two pages only.</p>{demo&&<p className="status-note">Preview only — use a sample receipt or choose “Try reading a sample receipt” below. Do not upload real banking information.</p>}
 {demo&&<button type="button" className="button button-outline-dark" disabled={busy||reading} onClick={()=>void sample()}>Try reading a sample receipt</button>}
 {message&&<p role="status" aria-live="polite">{message}</p>}
 {reading&&<button type="button" className="text-button" onClick={manual}>Enter the number myself</button>}
 <label className="form-field">Bank transaction ID / receipt number *<input disabled={busy||reading} required={!demo} minLength={4} maxLength={100} value={reference} onChange={e=>edit(e.target.value)}/></label>
 <p>We will try to fill this from your upload. Correct it if needed. Use the bank-issued transaction ID, not your invoice number.</p>
 <label className="form-check"><input type="checkbox" required={!demo} disabled={busy||reading||!reference} checked={checked} onChange={e=>{setChecked(e.target.checked);onReady(e.target.checked);}}/><span>I checked that this transaction ID matches my receipt.</span></label>
 </>;
}
