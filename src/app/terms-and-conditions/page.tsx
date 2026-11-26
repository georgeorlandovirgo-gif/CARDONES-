import type {Metadata} from 'next';
import Link from 'next/link';

export const metadata:Metadata={
 title:"Terms and Conditions of Sale",
 description:"Read the Cardone’s Products terms for cosmetic oils, payment, delivery, returns and customer protections in Jamaica."
};

const sections: Array<{title:string;clauses:Array<[string,string]>}> = [
 {title:"1. Products and intended use",clauses:[
  ["1.1 Product range","Cardone’s sells natural and plant-derived hair and skin care oils, including castor, avocado, extra virgin coconut, extra virgin olive, golden jojoba, rosemary and palm oils, together with any additional products introduced from time to time."],
  ["1.2 External cosmetic use only","Unless a product is expressly labelled otherwise, Cardone’s oils are marketed for external cosmetic application to hair, scalp and skin only. Do not ingest, inject or otherwise use the oils internally. Follow the instructions and warnings on the specific product label."],
  ["1.3 No medical claims","Our oils are cosmetic products, not medicines. Descriptions of moisturising, conditioning, softening or improving appearance are cosmetic descriptions. We do not promise to diagnose, treat, cure or prevent hair loss, acne, eczema, infections or any other medical condition."],
  ["1.4 Individual results","Cosmetic results vary with skin and hair type, frequency and method of use, and individual circumstances. Testimonials describe personal experiences and do not guarantee the same results for others."],
  ["1.5 Natural variations","Colour, scent and consistency can vary between batches of natural oils. Extra virgin coconut oil, for example, may naturally solidify or become cloudy in cooler conditions. Normal changes are not necessarily defects, but products must still be safe and as described."]
 ]},
 {title:"2. Product safety and customer responsibilities",clauses:[
  ["2.1 Patch testing","We recommend testing a small amount on an appropriate area of skin before wider use. Stop use if irritation, itching, redness, swelling or another reaction occurs."],
  ["2.2 Allergies and sensitivities","Review available ingredient and caution information. If you have known allergies, sensitive skin, a relevant medical condition or are unsure whether an oil is appropriate for you, seek advice from a qualified health professional before use."],
  ["2.3 Proper use","Follow product-specific directions. Avoid contact with eyes and other sensitive areas unless a product is expressly intended for those uses. Do not apply to broken or severely irritated skin unless instructed by an appropriately qualified professional."],
  ["2.4 Storage and children","Keep containers closed and protected from contamination, excessive heat and direct sunlight according to the label. Keep products out of the reach of children."],
  ["2.5 Alteration after delivery","We are not responsible for damage caused solely by misuse, contamination after opening, inappropriate storage or unauthorised mixing or alteration by others, except to the extent we remain legally responsible."],
  ["2.6 Report concerns","If you believe an oil is defective or has caused an adverse reaction, stop using it, seek medical help if needed, and contact Cardone’s with the product name, order reference and batch information if available."]
 ]},
 {title:"3. Product descriptions and availability",clauses:[
  ["3.1 Accuracy","We make reasonable efforts to describe ingredients, bottle sizes, quantities, prices and products accurately."],
  ["3.2 Photographs and packaging","Product photographs are illustrative. Minor changes to presentation and packaging may occur, but we will not knowingly supply a materially different product without appropriate notice or agreement."],
  ["3.3 Stock","Products are subject to availability. Listing an item does not guarantee stock. We may change or discontinue products while respecting accepted orders and applicable rights."]
 ]},
 {title:"4. Eligibility and ordering",clauses:[
  ["4.1 Age and capacity","By placing an order you confirm that you are at least 18 years old and legally able to enter the transaction, or that you are acting with appropriate legal authority."],
  ["4.2 Accurate details","You must provide correct contact, billing, delivery and collection information, and notify us promptly of an error."],
  ["4.3 Review before ordering","You will be given an opportunity to review the products, quantities, cost and delivery details, correct errors and withdraw before final submission."],
  ["4.4 Invoice and acceptance","Generating an invoice or uploading a receipt is not itself acceptance of an order or confirmation of payment. Cardone’s accepts an order for fulfilment only after applicable stock and payment checks and confirmation."],
  ["4.5 Refusal or cancellation","We may refuse or cancel an order for legitimate reasons such as unavailable stock, material pricing errors, unverifiable payment, suspected fraud or delivery impossibility. If we cannot fulfil an order after receiving funds, we will notify you and arrange any refund required by law."],
  ["4.6 Requested changes","Contact us promptly to change an order. Changes may not be possible once preparation or dispatch begins; statutory cancellation and consumer rights remain unaffected."]
 ]},
 {title:"5. Prices, invoices and bank transfers",clauses:[
  ["5.1 Jamaican dollars","Prices are stated in Jamaican dollars (JMD) unless expressly indicated otherwise. Applicable taxes and delivery or collection charges will be disclosed before the customer commits."],
  ["5.2 Standard packaging","Our usual protective packaging cost may be built into product prices. A separate packaging charge will apply only if disclosed before purchase."],
  ["5.3 Invoice instructions","The invoice states the amount payable and official bank details once those details are configured. Transfer money only to the account officially shown by Cardone’s after verifying the instructions."],
  ["5.4 Proof of payment","A customer may need to upload a bank receipt. A receipt may be read automatically to suggest the transaction reference, but any extracted information must be verified. Uploading proof is not proof that cleared funds were received."],
  ["5.5 Independent verification","Cardone’s may hold preparation, acceptance or dispatch until the correct funds are independently verified in its bank account."],
  ["5.6 Payment differences","An underpayment may require an additional transfer; an overpayment will be reconciled and refunded or otherwise addressed lawfully."],
  ["5.7 Payment fraud","We may investigate and refuse transactions supported by falsified, altered or reused payment evidence. We may take appropriate lawful action where fraud is reasonably suspected."],
  ["5.8 Legitimate disputes","Nothing prevents customers from pursuing a genuine bank dispute, complaint, chargeback where applicable, or any remedy provided by law."]
 ]},
 {title:"6. Delivery and collection",clauses:[
  ["6.1 Service area","Cardone’s primarily serves customers in Jamaica. Available delivery services and coverage depend on the options displayed at checkout."],
  ["6.2 Collection and door delivery","Depending on availability, you may choose a courier or other collection point or a door-to-door delivery service. The chosen method and relevant charges are shown before purchase."],
  ["6.3 Current dispatch pattern","The checkout currently describes Wednesday and Saturday dispatches after payment verification. These are dispatch days, not guaranteed arrival dates. Cardone’s will confirm the dispatch arrangement."],
  ["6.4 Courier charges","Some courier services require payment directly to the courier upon collection or delivery; others may be prepaid with the order. The applicable arrangement will be disclosed at checkout."],
  ["6.5 Incorrect details or missed deliveries","Customers must provide a correct address and reachable contact number. Disclosed, reasonable additional redelivery or handling charges may apply when incorrect details or customer unavailability causes a failed delivery, where legally permissible."],
  ["6.6 Uncollected parcels","Customers choosing collection must collect within the provider’s stated period. We may contact you to arrange redelivery or return, subject to any lawful, properly disclosed additional charges."],
  ["6.7 Loss and risk","Responsibility for loss or damage is governed by the applicable contract and Jamaican law. Cardone’s does not automatically disclaim responsibility merely because an independent courier has received the parcel."],
  ["6.8 Delays","Delivery estimates are not guarantees unless a deadline is expressly agreed. Serious weather, hurricanes, floods and transport disruptions may cause delays; we will communicate material changes as reasonably practicable and honour applicable legal remedies."],
  ["6.9 Zip Mail Post-to-Post rate","Where available at checkout, Zip Mail Post-to-Post collection is charged at the published standard rate of J$500 per package up to 10 lb, including packaging. The standard charge is prepaid with the products and is subject to changes made by Jamaica Post."],
  ["6.10 Zip Mail heavier parcels","For a Zip Mail parcel heavier than 10 lb, Cardone’s covers additional postage above the 10 lb standard charge up to J$1,500 per order. The courier’s published additional-weight rate is currently J$50 per pound or part thereof. Package weight must be confirmed when packed; if additional postage exceeds Cardone’s J$1,500 contribution, we will inform you and obtain your agreement to any remaining charge before requiring further payment or dispatching the order. No unagreed surcharge will be imposed."]
 ]},
 {title:"7. Packaging and transit damage",clauses:[
  ["7.1 Reasonable protection","Cardone’s will take reasonable care in packing bottles, including glass containers, for ordinary transport and handling."],
  ["7.2 Inspect promptly","Please inspect delivered goods promptly and, if possible, photograph visible damage to the packaging or bottles."],
  ["7.3 Report damage","We encourage reports of leakage or breakage as soon as reasonably possible, preferably within 48 hours of receipt, with the order reference and any available photographs. The 48-hour preference does not cancel statutory rights."],
  ["7.4 Resolution","We will assess damage claims fairly and provide an appropriate remedy when legally responsible. Photos or an unboxing recording are helpful but are not an absolute condition of a lawful claim."]
 ]},
 {title:"8. Cancellations, returns and refunds",clauses:[
  ["8.1 Seven-day online cancellation right","Where section 28 of Jamaica’s Electronic Transactions Act applies, a consumer generally may cancel a qualifying electronic purchase of goods without giving a reason within seven days after receiving the goods, subject to the Act’s exceptions and requirements."],
  ["8.2 Exceptions","Statutory exceptions may include goods made to customer specifications, clearly personalised goods, goods that by their nature cannot be returned, and goods likely to deteriorate or expire rapidly. Any exception is assessed according to the law and the individual transaction."],
  ["8.3 Opened cosmetics","For hygiene and contamination-prevention reasons, Cardone’s does not generally offer voluntary change-of-mind returns for opened, used or contaminated goods. Opening a bottle does not automatically eliminate a consumer’s statutory cancellation or defective-product rights."],
  ["8.4 Voluntary returns","Outside mandatory consumer rights, change-of-mind returns are discretionary and subject to any conditions agreed with Cardone’s."],
  ["8.5 Faulty or misdescribed items","If an item is defective, unsafe, materially misdescribed or otherwise fails applicable statutory standards, the customer may be entitled to the appropriate legal remedy, including replacement or refund in relevant circumstances."],
  ["8.6 How to contact us","Contact Cardone’s with your order reference, contact details and the issue before arranging a return. We will provide reasonable instructions."],
  ["8.7 Return costs","Where statutory cancellation applies, any return cost is governed by the Electronic Transactions Act and other applicable law. Cardone’s will not impose charges prohibited by law."],
  ["8.8 Refund period","For a valid cooling-off cancellation under section 28, we will process refunds within the statutory timeframe, generally 30 days after cancellation. Other refunds follow applicable legal time limits."],
  ["8.9 Refund destination","Where reasonably practicable, a refund will go to the original verified payer or originating account. We may seek reasonable information to prevent payment fraud."],
  ["8.10 Additional cancellation rights","A consumer may have an additional 14-day cancellation remedy where a supplier fails to comply with section 27’s information or checkout requirements. Nothing here restricts that right."]
 ]},
 {title:"9. Liability and consumer protections",clauses:[
  ["9.1 No guaranteed results","Individual cosmetic outcomes cannot be guaranteed. Not obtaining a desired result does not by itself mean a product is defective."],
  ["9.2 Misuse","To the extent permitted by law, Cardone’s is not responsible for loss caused solely by a customer’s deliberate misuse, unauthorised alteration or failure to follow clear safety instructions."],
  ["9.3 Economic loss","To the maximum extent the law permits, Cardone’s excludes liability for indirect or consequential economic losses that are not legally attributable to a breach of its obligations."],
  ["9.4 Contractual limitation","Where legally permissible, liability for purely contractual financial loss relating to a specific purchase is limited to the amount paid for that affected transaction."],
  ["9.5 Rights that cannot be excluded","Nothing in these Terms limits liability for fraud, death or personal injury caused by negligence, defective or unsafe goods where law imposes liability, or any consumer right or remedy that cannot lawfully be excluded."]
 ]},
 {title:"10. Authenticity, repackaging and resale",clauses:[
  ["10.1 Product integrity","Do not present diluted, altered, contaminated or repackaged products as original, unmodified Cardone’s products."],
  ["10.2 Authorised representation","No one may falsely claim to be an authorised Cardone’s distributor, representative, agent or wholesale partner."],
  ["10.3 Claims by resellers","No person may attribute false or unauthorised medical or therapeutic claims to Cardone’s."],
  ["10.4 Lawful resale","Commercial wholesale and branded distributor relationships require prior agreement. This does not prohibit any resale of genuine products that is otherwise lawful."]
 ]},
 {title:"11. Intellectual property",clauses:[
  ["11.1 Brand assets","The Cardone’s name, original packaging artwork, logos, text, photographs and website materials are owned by Cardone’s or their lawful rights holders."],
  ["11.2 Use of materials","Commercial reproduction, imitation or use of protected assets requires permission unless an applicable legal exception permits it."],
  ["11.3 Enforcement","We may pursue lawful remedies for counterfeiting, impersonation, deceptive branding and infringement."]
 ]},
 {title:"12. Website security and prohibited conduct",clauses:[
  ["12.1 Lawful use","Use the website only for legitimate browsing, enquiries and purchases."],
  ["12.2 Prohibited activity","Do not attempt unauthorised access, disrupt systems, introduce malicious code, misuse another person’s identity, submit fraudulent receipts, or exploit website errors to manipulate orders or prices."],
  ["12.3 Investigation","Cardone’s may restrict or suspend suspicious transactions or access where reasonably necessary and lawful."]
 ]},
 {title:"13. Privacy and personal data",clauses:[
  ["13.1 Information collected","We may collect names, contact and delivery details, order records and bank-transfer verification information to administer orders and support customers."],
  ["13.2 Uploaded receipts","Payment receipts may reveal personal financial information. We use them only for legitimate verification, reconciliation, dispute management, fraud prevention and other lawful purposes."],
  ["13.3 Automated receipt reading","Receipt data may be extracted by automated software. Extraction is not final verification of payment."],
  ["13.4 Protection and sharing","Personal information will be handled under applicable Jamaican data-protection requirements, including the Data Protection Act, 2020. Information may be shared with couriers, service providers, financial institutions or competent authorities only where necessary and lawfully permitted."],
  ["13.5 Customer communications","We may send messages necessary to fulfil your order. Promotional communication will follow applicable consent and opt-out rules."],
  ["13.6 Additional information","See our Privacy information on the Policies page for further details. Cardone’s must publish a complete, business-approved privacy policy before accepting live orders."]
 ]},
 {title:"14. Customer reviews and testimonials",clauses:[
  ["14.1 Authenticity","Reviews should be truthful, lawful and based on genuine experiences."],
  ["14.2 Unlawful content","We may moderate impersonation, knowingly false allegations, unlawful material or harmful content."],
  ["14.3 Permission","We will obtain appropriate permission before using identifiable customer photographs or testimonials in marketing."],
  ["14.4 No guarantees","A published testimonial does not guarantee the same result for every customer."]
 ]},
 {title:"15. Complaints and dispute resolution",clauses:[
  ["15.1 Contact us first","If you experience an issue with an order, payment, delivery or product, please contact Cardone’s so we can investigate and seek a fair resolution."],
  ["15.2 Regulatory rights","You may contact Jamaica’s Consumer Affairs Commission or another competent authority. These Terms do not limit the right to bring a lawful claim."],
  ["15.3 Court proceedings","If a dispute cannot be resolved, either party may seek remedies in an appropriate court or through another legally available process."]
 ]},
 {title:"16. Governing law",clauses:[
  ["16.1 Jamaica","These Terms are governed by Jamaican law, subject to any mandatory consumer protections or jurisdictional requirements that apply."]
 ]},
 {title:"17. Changes to these Terms",clauses:[
  ["17.1 Updates","Cardone’s may revise these Terms as its products, operations, technology or legal obligations change. The updated version and date will be published on this page."],
  ["17.2 Existing orders","Changes will not retrospectively alter an already accepted order without a valid legal basis or lawful agreement."]
 ]},
 {title:"18. Severability and agreement",clauses:[
  ["18.1 Severability","If part of these Terms is unlawful or unenforceable, the remaining provisions continue to apply where permitted."],
  ["18.2 Contract documents","These Terms, the applicable order summary, agreed product information, and policies expressly incorporated into the transaction form the contract to the extent consistent with mandatory law."]
 ]},
 {title:"19. Contact and business details",clauses:[
  ["19.1 Trading name","Cardone’s Products — Jamaica."],
  ["19.2 Customer contact","Use the contact details published on our Contact page for order enquiries, complaints and requests for the legal business and service address."],
  ["19.3 Formal disclosures","The full legal supplier name, address for service, registration details where applicable, website address, telephone and email must be made available before live online sales begin, as required by Jamaican law."]
 ]}
];

export default function TermsAndConditionsPage(){
 return <>
  <section className="page-hero"><div className="container"><span className="eyebrow">CARDONE’S PRODUCTS / SHOP WITH CONFIDENCE</span><h1>Terms &amp; <em>Conditions.</em></h1><p>Important information on how to purchase, receive and use our cosmetic oils.</p><p className="terms-updated">Last updated: 23 November 2026</p></div></section>
  <section className="section terms-section"><div className="container terms-layout">
   <div className="terms-notice"><strong>Important: external cosmetic use only.</strong><p>Unless a product is expressly labelled otherwise, Cardone’s oils are intended for external cosmetic application to hair and skin—not for ingestion, injection or internal use.</p><p>Nothing in these Terms excludes rights that cannot be lawfully excluded under Jamaica’s Consumer Protection Act, Electronic Transactions Act, Sale of Goods Act or other applicable laws.</p></div>
   <nav className="terms-jump" aria-label="Terms and conditions sections"><strong>On this page</strong><ol>{sections.map((section,i)=><li key={section.title}><a href={'#terms-'+(i+1)}>{section.title}</a></li>)}</ol></nav>
   <div className="terms-body">{sections.map((section,i)=><section className="terms-article" id={'terms-'+(i+1)} key={section.title}><h2>{section.title}</h2>{section.clauses.map(([label,description])=><p key={label}><strong>{label}.</strong> {description}</p>)}</section>)}</div>
   <p className="terms-final-note">For shipping, returns and privacy information, visit our <Link href="/policies">Policies page</Link>. For help with an order, <Link href="/contact">contact Cardone’s</Link>.</p>
  </div></section>
 </>;
}
