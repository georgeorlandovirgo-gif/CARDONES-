"use client";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Instagram, ArrowRight } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { whatsappHref } from "@/lib/store-settings";
export default function ContactPage(){
 const {settings}=useStore();
 const wa=settings.whatsapp_enabled?whatsappHref(settings.whatsapp_number,"Hello Cardone’s Products. I have a question about your botanical oils."):null;
 return <><section className="page-hero"><div className="container"><span className="eyebrow">A PERSONAL TOUCH</span><h1>We’d love to <em>hear from you.</em></h1><p>Cardone’s Products is a growing Jamaican family business. Questions about our oils, a size or a product coming soon? Reach us using our confirmed contact options below.</p></div></section>
  <section className="section"><div className="container contact-grid"><article className="contact-card"><MapPin size={29}/><span className="eyebrow">OUR ROOTS</span><h2>Jamaica, with care.</h2><p>{settings.business_location||"St. Elizabeth, Jamaica"}</p>{settings.contact_hours&&<p>{settings.contact_hours}</p>}</article>
  <article className="contact-card"><MessageCircle size={29}/><span className="eyebrow">LET’S TALK</span><h2>Here to help.</h2>{settings.business_phone&&<a href={"tel:"+settings.business_phone}><Phone size={17}/>{settings.business_phone}</a>}{settings.support_email&&<a href={"mailto:"+settings.support_email}><Mail size={17}/>{settings.support_email}</a>}{wa&&<a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle size={17}/> Message us on WhatsApp</a>}{settings.instagram_url&&<a href={settings.instagram_url} target="_blank" rel="noopener noreferrer"><Instagram size={17}/> Instagram</a>}{!wa&&!settings.business_phone&&!settings.support_email&&<p>Customer contact channels have not yet been published.</p>}</article>
  </div></section><section className="section"><div className="container contact-cta"><h2>Discover the <em>collection.</em></h2><p>Explore the oils, view the bottle sizes and tell us what you would like to know.</p><Link href="/shop" className="button button-dark">Browse our oils <ArrowRight size={17}/></Link></div></section></>;
}
