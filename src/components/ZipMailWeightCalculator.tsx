'use client';
import {useState} from 'react';
import {calculateZipMailPostage,ZIP_MAIL_FIRST_10_LBS,ZIP_MAIL_RATE_SOURCE,type ZipMailMode} from '@/lib/zip-mail';
import {jmd} from '@/lib/money';

/**
 * Internal owner calculation: final packed weight is measured by Cardone’s,
 * not estimated by a customer or from bottle volume.
 * No invoice adjustment or payment request is generated from this tool.
 */
export function ZipMailWeightCalculator(){
 const [weight,setWeight]=useState('');
 const [mode,setMode]=useState<ZipMailMode>('post_to_post');
 const lbs=Number(weight);
 const quote=weight.trim()&&Number.isFinite(lbs)&&lbs>0?calculateZipMailPostage(lbs,mode):null;
 return <section className="zip-owner-calc" aria-label="Zip Mail packed-weight postage calculator">
  <h4>Zip Mail packed-weight calculator (owner only)</h4>
  <p>After packing an order, weigh the complete protected parcel. Enter its weight here to calculate the extra postage and Cardone’s contribution. The website invoices the selected Post Office-origin service’s standard postage (J$500 to a post office, or J$850 to a customer’s door).</p>
  <label className="form-field">Zip Mail destination service
   <select value={mode} onChange={e=>setMode(e.target.value as ZipMailMode)}>
    <option value="post_to_post">Post Office → Post Office (J$500)</option>
    <option value="post_to_door">Post Office → Door (J$850)</option>
   </select>
  </label>
  <label className="form-field">Verified parcel weight (lb)
   <input type="number" min="0.01" max="1000" step="0.01" inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="e.g. 12.5"/>
  </label>
  {quote&&<div className="zip-owner-results" role="status">
   <p>Standard postage (up to {ZIP_MAIL_FIRST_10_LBS} lb): <strong>{jmd(quote.baseJmd)}</strong></p>
   <p>Additional charge ({quote.chargeableExtraLbs} lb): <strong>{jmd(quote.extraPostageJmd)}</strong></p>
   <p>Cardone’s contribution: <strong>{jmd(quote.cardonesContributionJmd)}</strong></p>
   <p>Additional customer balance: <strong>{jmd(quote.additionalCustomerJmd)}</strong></p>
   {quote.requiresCustomerApproval?<p className="status-note"><strong>Action required:</strong> Obtain customer approval of the additional {jmd(quote.additionalCustomerJmd)} and verify receipt before dispatch. Any supplementary charge must be handled and recorded separately; this calculator does not change the existing invoice or collect funds.</p>:<p className="status-note">No extra postage is payable by the customer under Cardone’s stated contribution policy.</p>}
  </div>}
  <p className="cart-caveat">Rates from Jamaica Post’s <a href={ZIP_MAIL_RATE_SOURCE} target="_blank" rel="noopener noreferrer">published sheet</a>, effective July 1, 2022. Confirm the current counter rate before shipping.</p>
 </section>;
}
