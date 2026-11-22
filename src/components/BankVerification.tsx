'use client';
import {useState,type FormEvent} from 'react';
export function BankVerification({order,busy,onSave}:{order:Record<string,unknown>;busy:boolean;onSave:(x:Record<string,unknown>)=>Promise<void>}){
 const [credit,setCredit]=useState(''),[amount,setAmount]=useState(''),[note,setNote]=useState(''),[checked,setChecked]=useState(false);
 const flags=Array.isArray(order.review_flags)?order.review_flags as string[]:[];
 async function submit(e:FormEvent){e.preventDefault();await onSave({action:'verifyBankCredit',id:order.id,creditReference:credit,amountJmd:Number(amount),reviewNote:note,bankConfirmed:checked});}
 return <div>{flags.length>0&&<div role="status"><strong>Payment review warnings — these are not a finding of fraud</strong><ul>{flags.map(f=><li key={f}>{f}</li>)}</ul></div>}
 {order.status==='payment_submitted'&&<details><summary>Verify funds against your bank account</summary><p>Open your bank app or statement independently. Match the receiving account, cleared credit, amount, date, sender and transaction ID. A screenshot, notification or pending transfer is not confirmation.</p><form onSubmit={submit}>
 <label className="form-field">Unique credit transaction ID from your own bank record<input required minLength={4} maxLength={100} value={credit} onChange={e=>setCredit(e.target.value)}/></label>
 <label className="form-field">Amount actually credited (JMD)<input required type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
 <label className="form-field">Review notes {flags.length>0?'(required: explain duplicate warnings)':'(optional)'}<textarea required={flags.length>0} minLength={flags.length>0?10:undefined} maxLength={600} value={note} onChange={e=>setNote(e.target.value)}/></label>
 <label><input required type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> I independently confirmed cleared funds in Cardone’s bank account and matched them to this invoice.</label>
 <button type="submit" className="button button-dark" disabled={busy||!checked}>Record bank verification</button></form></details>}
 {Boolean(order.bank_credit_reference)&&<p>Owner-recorded bank credit: {String(order.bank_credit_reference)} · J$ {Number(order.bank_received_jmd).toLocaleString('en-JM')}</p>}</div>;
}
