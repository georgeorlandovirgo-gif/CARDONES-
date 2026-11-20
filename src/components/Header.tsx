"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, X, Leaf } from "lucide-react";
import { useStore } from "@/components/StoreProvider";

const links = [
  { href: "/shop", text: "The collection" },
  { href: "/about", text: "Our story" },
  { href: "/faq", text: "Oil rituals" },
  { href: "/contact", text: "Contact" },
];
export function Header() {
  const pathname = usePathname();
  const { count, setCartOpen } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <div className="announcement announcement-luxe"><span className="announcement-flag">🇯🇲</span><span>ROOTED IN JAMAICA · MADE WITH YOU IN MIND</span><span className="announcement-right">THE CARDONE’S BOTANICAL COLLECTION</span></div>
    <header className="header header-luxe"><div className="container header-inner">
      <button className="icon-button mobile-menu" onClick={() => setMobileOpen(v=>!v)} aria-label={mobileOpen?"Close menu":"Open menu"}>{mobileOpen?<X size={23}/>:<Menu size={23}/>}</button>
      <Link href="/" className="wordmark wordmark-luxe" onClick={() => setMobileOpen(false)} aria-label="Cardone's Products home"><span className="wordmark-leaf"><Leaf size={16} strokeWidth={1.4}/></span><span className="wordmark-name">CARDONE’S</span><span className="wordmark-sub"><i/>PRODUCTS<i/></span></Link>
      <nav className="main-nav" aria-label="Main navigation">{links.map(x=><Link key={x.href} href={x.href} className={pathname===x.href ? "active" : ""}>{x.text}</Link>)}</nav>
      <div className="header-actions"><Link href="/shop" className="icon-button search-trigger" aria-label="Explore products"><Search size={21} strokeWidth={1.6}/></Link><span className="header-actions-rule"/><button className="icon-button bag-trigger" onClick={()=>setCartOpen(true)} aria-label={`Open shopping bag, ${count} items`}><ShoppingBag size={22} strokeWidth={1.6}/>{count>0&&<span className="bag-count">{count}</span>}</button><span className="header-bag-label">BAG</span></div>
    </div></header>
    {mobileOpen && <div className="mobile-nav"><nav>{links.map(x=><Link key={x.href} href={x.href} onClick={()=>setMobileOpen(false)}>{x.text}<ArrowRight size={18}/></Link>)}</nav></div>}
  </>;
}