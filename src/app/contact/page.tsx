"use client";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Instagram, ArrowRight } from "lucide-react";
import { useMerchant } from "@/components/MerchantProvider";

export default function ContactPage(){
 const settings=useMerchant();
 const wa=settings.whatsapp?`https://wa.me/${settings.whatsapp.replace(/\\D/g,"")}?text=${encodeURIComponent("Hello Cardone’s Products. I have a question about your botanical oils.")}`:null;
 return <><section className="page-hero"><div className="container"><span className="eyebrow">A PERSONAL TOUCH</span><h1>We’d love to <em>hear from you.</em></h1><p>Cardone’s Products is a growing Jamaican family business. Questions about our oils, a size or a product coming soon? Reach us using our confirmed contact options below.</p></div></section>
  <section className="section"><div className="container contact-grid"><article className="contact-card"><MapPin size={29}/><span className="eyebrow">OUR ROOTS</span><h2>Jamaica, with care.</h2><p>{settings.location||"St. Elizabeth, Jamaica"}</p>{settings.contactHours&&<p>{settings.contactHours}</p>}</article>
  <article className="contact-card"><MessageCircle size={29}/><span className="eyebrow">LET’S TALK</span><h2>Here to help.</h2>{settings.phone&&<a href={"tel:"+settings.phone}><Phone size={17}/>{settings.phone}</a>}{settings.email&&<a href={"mailto:"+settings.email}><Mail size={17}/>{settings.email}</a>}{wa&&<a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> Message us on WhatsApp</a>}{settings.instagram&&<a href={settings.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={17}/> Instagram</a>}{!wa&&!settings.phone&&!settings.email&&<p>Customer contact channels have not yet been published.</p>}</article>
  </div></section><section className="section"><div className="container contact-cta"><h2>Discover the <em>collection.</em></h2><p>Explore the oils, view the bottle sizes and tell us what you would like to know.</p><Link href="/shop" className="button button-dark">Browse our oils <ArrowRight size={17}/></Link></div></section></>;
}
