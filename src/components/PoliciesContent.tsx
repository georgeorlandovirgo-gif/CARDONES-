"use client";
import { useStore } from "@/components/StoreProvider";
export function PoliciesContent(){
 const {settings}=useStore();
 return <><section className="page-hero"><div className="container"><span className="eyebrow">SHOP WITH CONFIDENCE</span><h1>Good to <em>know.</em></h1><p>Clear information for a thoughtful shopping experience.</p></div></section>
 <section className="section policies-section"><div className="container policies-layout">
 <div id="delivery"><span className="eyebrow">01 / DELIVERY</span><h2>Delivery & pickup</h2><p>{settings.delivery_text}</p><p>Order requests are reviewed before fulfilment. Areas, fees and delivery timelines are confirmed with the merchant before payment. Any available confirmed delivery fee will be shown at checkout.</p></div>
 <div id="returns"><span className="eyebrow">02 / RETURNS</span><h2>Returns & exchanges</h2><p>{settings.returns_text}</p><p>Applicable Jamaican consumer protections continue to apply. Contact the merchant before returning opened or damaged products.</p></div>
 <div id="privacy"><span className="eyebrow">03 / PRIVACY</span><h2>Your information</h2><p>In the test preview no orders or customer information are collected. On a configured commercial website, we request name, telephone, optional email and delivery details to manage orders. Order details and payment receipts are kept in access-controlled systems; payment cards are not processed by this website. The owner must approve a full retention and privacy policy before opening for orders.</p></div>
 <div id="payments"><span className="eyebrow">04 / PAYMENTS</span><h2>Payment & pricing</h2><p>All known prices are expressed in Jamaican dollars (JMD). An item marked Price on request has no confirmed payable amount. Bank transfers, if enabled, must be independently verified by the merchant. Uploading a receipt does not prove payment, and no online credit card charges are processed.</p></div>
 </div></section></>;
}
