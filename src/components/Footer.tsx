"use client";
import Link from "next/link";
import { ArrowUpRight, Instagram, Leaf, MessageCircle, Mail } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { whatsappHref } from "@/lib/store-settings";
export function Footer(){
 const {settings}=useStore();
 const wa=settings.whatsapp_enabled?whatsappHref(settings.whatsapp_number,"Hello Cardone’s Products. I would like to learn more about your oils."):null;
 return <footer className="footer"><div className="container">
  <div className="footer-top"><div><span className="eyebrow">BOTANICAL BEAUTY, THE CARDONE’S WAY</span><h2>Rituals rooted<br/><em>in nature.</em></h2></div><Link href="/shop" className="button button-outline-light">Explore the collection <ArrowUpRight size={17}/></Link></div>
  <div className="footer-divider"/>
  <div className="footer-columns">
   <div className="footer-brand"><Link href="/" className="footer-wordmark">CARDONE’S <span>PRODUCTS</span></Link><p>A thoughtfully presented collection of hair and skin oils, packaged in St. Elizabeth, Jamaica.</p><p className="footer-location"><Leaf size={15}/> Made with you in mind.</p></div>
   <div><h4>Discover</h4><Link href="/shop">The collection</Link><Link href="/about">Our story</Link><Link href="/faq">Oil rituals</Link><Link href="/contact">Contact us</Link></div>
   <div><h4>Help & information</h4><Link href="/policies#delivery">Delivery & pickup</Link><Link href="/policies#returns">Returns & exchanges</Link><Link href="/policies#privacy">Privacy</Link><Link href="/faq">Frequently asked questions</Link></div>
   <div><h4>Let’s connect</h4><p>Questions about an oil or a potential order? We’d be glad to help.</p>{settings.support_email&&<a href={"mailto:"+settings.support_email}><Mail size={16}/> {settings.support_email}</a>}{settings.business_phone&&<a href={"tel:"+settings.business_phone}>{settings.business_phone}</a>}{wa&&<a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> Chat on WhatsApp</a>}{settings.instagram_url&&<a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"><Instagram size={16}/> Instagram</a>}{settings.facebook_url&&<a href={settings.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a>}{!settings.support_email&&!settings.business_phone&&!wa&&<p>Direct contact details will appear once confirmed by the owner.</p>}</div>
  </div>
  <div className="footer-bottom"><span>© {new Date().getFullYear()} Cardone’s Products. All rights reserved.</span><span>Thoughtfully presented in Jamaica <span className="footer-spark">✦</span></span></div>
 </div></footer>;
}
