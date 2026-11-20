"use client";

import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/components/StoreProvider";

import { jmd } from "@/lib/money";

export function CartDrawer() {
  const { lines, cartOpen, setCartOpen, subtotal, hasUnpriced, setQuantity, remove, findItem } = useStore();
  useEffect(() => {
    if (!cartOpen) return;
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") setCartOpen(false); }
    document.addEventListener("keydown", handleKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = old; };
  }, [cartOpen, setCartOpen]);
  if (!cartOpen) return null;
  return <div className="cart-layer" role="presentation"><button className="cart-backdrop" onClick={()=>setCartOpen(false)} aria-label="Close shopping bag"/>
    <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Your shopping bag">
      <div className="cart-panel-header"><div><span className="eyebrow tiny">YOUR CURATED SELECTION</span><h2>The shopping bag</h2></div><button className="icon-button" onClick={()=>setCartOpen(false)} aria-label="Close shopping bag"><X size={22}/></button></div>
      {lines.length===0 ? <div className="cart-empty"><ShoppingBag size={42} strokeWidth={1}/><h3>Your bag awaits.</h3><p>Discover your next botanical ritual.</p><button onClick={()=>setCartOpen(false)} className="button button-dark">Continue shopping <ArrowRight size={16}/></button></div> : <>
        <div className="cart-lines">{lines.map((line) => {const detail=findItem(line.productId,line.variantId);if(!detail)return null; const {product,variant}=detail; return <div key={`${line.productId}-${line.variantId}`} className="cart-line">
          <div className={`cart-thumb cart-thumb--${product.accent}`}>{product.image ? <Image src={assetUrl(product.image)} alt={product.name} fill sizes="90px"/> : <span>✧</span>}</div>
          <div className="cart-line-info"><Link href={`/products/${product.slug}`} onClick={()=>setCartOpen(false)}>{product.name}</Link><small>{variant.label}</small><strong>{variant.priceJmd === null ? "Price to be confirmed" : jmd(variant.priceJmd * line.quantity)}</strong>
            <div className="cart-qty-row"><div className="qty-chooser"><button aria-label="Decrease quantity" onClick={()=>line.quantity===1?remove(line.productId,line.variantId):setQuantity(line.productId,line.variantId,line.quantity-1)}><Minus size={14}/></button><span>{line.quantity}</span><button aria-label="Increase quantity" onClick={()=>setQuantity(line.productId,line.variantId,line.quantity+1)} disabled={line.quantity>=20}><Plus size={14}/></button></div><button className="remove-line" onClick={()=>remove(line.productId,line.variantId)} aria-label={`Remove ${product.name}`}><Trash2 size={17}/></button></div>
          </div>
        </div>})}</div>
        <div className="cart-summary"><div className="cart-summary-line"><span>Priced items subtotal</span><strong>{jmd(subtotal)}</strong></div>{hasUnpriced&&<p className="cart-caveat">One or more items require a price quotation. Your final total will be confirmed before payment.</p>}<p className="cart-caveat">Delivery or pickup arrangements are confirmed separately. No online card charges are made.</p><Link href="/checkout" className="button button-dark full" onClick={()=>setCartOpen(false)}>Continue to checkout <ArrowRight size={17}/></Link><button className="text-button" onClick={()=>setCartOpen(false)}>Keep exploring</button></div>
      </>}
    </aside>
  </div>;
}