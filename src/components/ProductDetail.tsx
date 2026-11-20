"use client";
import Link from "next/link";
import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import { ArrowLeft, ArrowRight, Check, Droplets, Minus, Plus, ShoppingBag, ZoomIn, X } from "lucide-react";
import { useState } from "react";
import {useDialog} from "./useDialog";
import { ProductVisual } from "@/components/ProductVisual";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/catalog";
import { jmd } from "@/lib/money";
import { useCatalog } from "@/components/CatalogProvider";
export function ProductDetail({ product }: { product: Product }) {
  const catalog=useCatalog(); product=catalog.find(p=>p.id===product.id)||product;
  const [selected,setSelected] = useState(product.variants[0].id);
  const [qty,setQty]=useState(1);
  const [zoom,setZoom]=useState(false);
  const dialog=useDialog(zoom,()=>setZoom(false));
  const [galleryView,setGalleryView]=useState<"bottle"|"label">("bottle");
  const {add}=useStore();
  const variant=product.variants.find(v=>v.id===selected)||product.variants[0];
  const inStock=variant.available && variant.stockCount !== 0;
  return <><div className="container breadcrumb"><Link href="/shop"><ArrowLeft size={15}/> The collection</Link><span>/</span><span>{product.name}</span></div>
    <div className="container detail-layout"><div className="detail-gallery"><ProductVisual product={product} priority mode="detail" view={galleryView}/><button type="button" className="product-gallery-zoom" aria-label="Enlarge product photograph" onClick={()=>setZoom(true)}><ZoomIn size={18}/> Zoom image</button>{product.labelImage && <div className="product-gallery-switch" role="group" aria-label="Product photo view"><button className={galleryView === "bottle" ? "selected" : ""} onClick={() => setGalleryView("bottle")} aria-pressed={galleryView === "bottle"}>Glass bottle</button><button className={galleryView === "label" ? "selected" : ""} onClick={() => setGalleryView("label")} aria-pressed={galleryView === "label"}>Original label artwork</button></div>}<div className="detail-gallery-caption">Illustrative bottle presentation · Original label artwork available above</div></div>
    <div className="detail-info"><span className="eyebrow">CARDONE’S PRODUCTS / {(product.category[0]||'Botanical').toUpperCase()} CARE</span><h1>{product.name}</h1><p className="detail-subtitle">{product.subtitle}</p><div className="detail-rule"/><div className="detail-price">{inStock ? variant.priceJmd===null ? "Price on request" : jmd(variant.priceJmd) : variant.available?"Sold out":"Coming soon"}</div><p className="detail-intro">{product.description}</p>
    <div className="detail-variants"><label>CHOOSE YOUR SIZE</label><div className="variant-grid">{product.variants.map((v)=><button key={v.id} className={`${selected===v.id?"selected":""} ${!v.available||v.stockCount===0?"unavailable":""}`} onClick={()=>setSelected(v.id)} aria-pressed={selected===v.id}><span>{v.label}</span>{selected===v.id&&<Check size={15}/>}</button>)}</div></div>
    {inStock ? <div className="detail-buy-row"><div className="detail-qty"><button aria-label="Decrease quantity" disabled={qty<=1} onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus size={18}/></button><span>{qty}</span><button aria-label="Increase quantity" disabled={qty>=20||(variant.stockCount!==null&&variant.stockCount!==undefined&&qty>=variant.stockCount)} onClick={()=>setQty(q=>Math.min(20,variant.stockCount??20,q+1))}><Plus size={18}/></button></div><button className="button button-dark detail-add" onClick={()=>add(product.id,variant.id,qty)}><ShoppingBag size={18}/>{variant.priceJmd===null?"Add to quote bag":"Add to bag"}<ArrowRight size={17}/></button></div> : <div className="product-unavailable">{variant.available?"This size is currently sold out.":"This size is not yet available for online ordering. Check back for launch details."}</div>}
    <div className="detail-service"><Droplets size={20}/><div><strong>For your everyday ritual</strong><span>Packaged in St. Elizabeth, Jamaica. Delivery or pickup is arranged after order confirmation.</span></div></div>
    <div className="detail-sections"><details open><summary>What you’ll love <Plus size={18}/></summary><ul>{product.benefits.map(b=><li key={b}>{b}</li>)}</ul></details><details><summary>How to use <Plus size={18}/></summary><p>{product.howToUse}</p></details><details><summary>Ingredients & care <Plus size={18}/></summary><p>{product.ingredientsNote}</p><p className="note-small">{product.caution}</p></details><details><summary>Shipping & returns <Plus size={18}/></summary><p>Orders are currently intended for Jamaica. Pickup or delivery arrangements and fees are confirmed personally before fulfilment. <Link href="/policies#delivery" className="inline-link">Read our policies</Link>.</p></details></div>
    </div></div>{zoom&&<div className="product-lightbox" role="dialog" aria-modal="true" aria-label={`${product.name} enlarged photograph`}><button className="product-lightbox-backdrop" type="button" onClick={()=>setZoom(false)} aria-label="Close enlarged photograph"/><div ref={dialog} className="product-lightbox-content"><button type="button" className="product-lightbox-close" autoFocus onClick={()=>setZoom(false)} aria-label="Close enlarged photograph"><X size={26}/></button>{(galleryView==='label'?product.labelImage:product.image)&&<Image unoptimized={true} src={assetUrl((galleryView==='label'?product.labelImage:product.image)!)} alt={`${product.name} enlarged ${galleryView} view`} fill sizes="95vw"/>}</div></div>}</>;
}