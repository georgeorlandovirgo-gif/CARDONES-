"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Droplets, Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { ProductVisual } from "@/components/ProductVisual";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/catalog";
import { jmd } from "@/lib/money";
export function ProductDetail({ product }: { product: Product }) {
  const [selected,setSelected] = useState(product.variants[0].id);
  const [qty,setQty]=useState(1);
  const {add}=useStore();
  const variant=product.variants.find(v=>v.id===selected)!;
  return <><div className="container breadcrumb"><Link href="/shop"><ArrowLeft size={15}/> The collection</Link><span>/</span><span>{product.name}</span></div>
    <div className="container detail-layout"><div className="detail-gallery"><ProductVisual product={product} priority mode="detail"/><div className="detail-gallery-caption"><span>✧</span> THE CARDONE’S SIGNATURE COLLECTION <span>✧</span></div></div>
    <div className="detail-info"><span className="eyebrow">CARDONE’S PRODUCTS / {product.category[0].toUpperCase()} CARE</span><h1>{product.name}</h1><p className="detail-subtitle">{product.subtitle}</p><div className="detail-rule"/><div className="detail-price">{variant.available ? variant.priceJmd===null ? "Price on request" : jmd(variant.priceJmd) : "Coming soon"}</div><p className="detail-intro">{product.description}</p>
    <div className="detail-variants"><label>CHOOSE YOUR SIZE</label><div className="variant-grid">{product.variants.map((v)=><button key={v.id} className={`${selected===v.id?"selected":""} ${!v.available?"unavailable":""}`} onClick={()=>setSelected(v.id)} aria-pressed={selected===v.id}><span>{v.label}</span>{selected===v.id&&<Check size={15}/>}</button>)}</div></div>
    {variant.available ? <div className="detail-buy-row"><div className="detail-qty"><button aria-label="Decrease quantity" disabled={qty<=1} onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus size={18}/></button><span>{qty}</span><button aria-label="Increase quantity" disabled={qty>=20} onClick={()=>setQty(q=>Math.min(20,q+1))}><Plus size={18}/></button></div><button className="button button-dark detail-add" onClick={()=>add(product.id,variant.id,qty)}><ShoppingBag size={18}/>{variant.priceJmd===null?"Add to quote bag":"Add to bag"}<ArrowRight size={17}/></button></div> : <div className="product-unavailable">This size is not yet available for online ordering. Check back for launch details.</div>}
    <div className="detail-service"><Droplets size={20}/><div><strong>For your everyday ritual</strong><span>Packaged in St. Elizabeth, Jamaica. Delivery or pickup is arranged after order confirmation.</span></div></div>
    <div className="detail-sections"><details open><summary>What you’ll love <Plus size={18}/></summary><ul>{product.benefits.map(b=><li key={b}>{b}</li>)}</ul></details><details><summary>How to use <Plus size={18}/></summary><p>{product.howToUse}</p></details><details><summary>Ingredients & care <Plus size={18}/></summary><p>{product.ingredientsNote}</p><p className="note-small">{product.caution}</p></details><details><summary>Shipping & returns <Plus size={18}/></summary><p>Orders are currently intended for Jamaica. Pickup or delivery arrangements and fees are confirmed personally before fulfilment. <Link href="/policies#delivery" className="inline-link">Read our policies</Link>.</p></details></div>
    </div></div></>;
}