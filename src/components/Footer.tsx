"use client";
import Link from "next/link";
import {useMerchant} from "@/components/MerchantProvider";
import { ArrowUpRight, Instagram, Leaf } from "lucide-react";
export function Footer() {
  const settings=useMerchant();
  return <footer className="footer"><div className="container">
    <div className="footer-top"><div><span className="eyebrow">BOTANICAL BEAUTY, THE CARDONE’S WAY</span><h2>Routines rooted<br/><em>in nature.</em></h2></div><Link href="/shop" className="button button-outline-light">Explore the collection <ArrowUpRight size={17}/></Link></div>
    <div className="footer-divider"/>
    <div className="footer-columns"><div className="footer-brand"><Link href="/" className="footer-wordmark">CARDONE’S <span>PRODUCTS</span></Link><p>A thoughtfully presented collection of hair and skin oils, packaged in St. Elizabeth, Jamaica.</p><p className="footer-location"><Leaf size={15}/> Made with you in mind.</p></div>
      <div><h4>Discover</h4><Link href="/shop">Shop all oils</Link><Link href="/about">Our story</Link><Link href="/testimonials">Customer testimonials</Link><Link href="/faq">How to use our oils</Link></div>
      <div><h4>Help & information</h4><Link href="/policies#delivery">Delivery & pickup</Link><Link href="/policies#returns">Returns & exchanges</Link><Link href="/policies#privacy">Privacy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link><Link href="/faq">Frequently asked questions</Link></div>
      <div><h4>Let’s connect</h4><p>Questions about an oil or your order? Reach out to our team.</p>
        {settings.email&&<a href={`mailto:${settings.email}`}>{settings.email}</a>}
        {settings.phone&&<a href={`tel:+${settings.phone.replace(/\D/g,'')}`}>{settings.phone}</a>}
        {settings.whatsapp&&<a href={`https://wa.me/${settings.whatsapp.replace(/\D/g,'')}`} rel="noopener noreferrer" target="_blank">Chat on WhatsApp</a>}
        {settings.instagram&&<a href={settings.instagram} rel="noopener noreferrer" target="_blank"><Instagram size={17}/> Instagram</a>}
        {settings.facebook&&<a href={settings.facebook} rel="noopener noreferrer" target="_blank">Facebook</a>}
        {settings.location&&<p>{settings.location}</p>}</div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Cardone’s Products. All rights reserved.</span><span>Crafted with care for Jamaica <span className="footer-spark">✦</span></span></div>
  </div></footer>;
}