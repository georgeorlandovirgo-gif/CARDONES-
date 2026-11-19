"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useStore } from "@/components/StoreProvider";

const links = [{ href: "/shop", text: "Shop all oils" }, { href: "/about", text: "Our story" }, { href: "/faq", text: "The ritual guide" }];
export function Header() {
  const pathname = usePathname();
  const { count, setCartOpen } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <div className="announcement">A LITTLE LUXURY, BOTTLED IN JAMAICA <span>✦</span> COMPLEMENT YOUR DAILY RITUAL</div>
    <header className="header"><div className="container header-inner">
      <button className="icon-button mobile-menu" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>{mobileOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      <Link href="/" className="wordmark" onClick={() => setMobileOpen(false)} aria-label="Cardone's Products home"><span className="wordmark-name">CARDONE’S</span><span className="wordmark-sub"><i/>PRODUCTS<i/></span></Link>
      <nav className="main-nav" aria-label="Main navigation">{links.map((x) => <Link key={x.href} href={x.href} className={pathname === x.href ? "active" : ""}>{x.text}</Link>)}</nav>
      <div className="header-actions"><Link href="/shop" className="icon-button search-trigger" aria-label="Search products"><Search size={20}/></Link><button className="icon-button bag-trigger" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${count} items`}><ShoppingBag size={21}/>{count>0&&<span className="bag-count">{count}</span>}</button></div>
    </div></header>
    {mobileOpen && <div className="mobile-nav"><nav>{links.map(x=><Link key={x.href} href={x.href} onClick={()=>setMobileOpen(false)}>{x.text}<ArrowRight size={18}/></Link>)}</nav></div>}
  </>;
}