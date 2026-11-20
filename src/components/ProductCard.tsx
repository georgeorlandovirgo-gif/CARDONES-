"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { ProductVisual } from "@/components/ProductVisual";
import { useStore } from "@/components/StoreProvider";
import type { Product } from "@/lib/catalog";
import { jmd } from "@/lib/money";
import { useCatalog } from "@/components/CatalogProvider";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { add } = useStore();
  const catalog=useCatalog(); product=catalog.find(p=>p.id===product.id)||product;
  const variants = product.variants.filter((v) => v.available && v.stockCount !== 0);
  const available = variants.length > 0;
  const soldOut = !available && product.variants.some(v=>v.available&&v.stockCount===0);
  const firstVariant = variants[0];
  const pricedVariants = variants.filter(v => v.priceJmd !== null);
  const price = pricedVariants.length ? Math.min(...pricedVariants.map(v => v.priceJmd!)) : null;
  return <article className="product-card">
    <Link href={`/products/${product.slug}`} className="card-visual-link" aria-label={`See ${product.name} details`}>
      <ProductVisual product={product} priority={priority}/>
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <span className="card-explore">Explore <ArrowUpRight size={16}/></span>
    </Link>
    <div className="card-info">
      <div><p className="eyebrow tiny">CARDONE’S PRODUCTS</p><Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link><p className="card-subtitle">{product.subtitle}</p></div>
      <div className="card-foot"><span className="card-price">{price !== null ? jmd(price) : available ? "Price on request" : soldOut ? "Sold out" : "Coming soon"}</span>
        {available && firstVariant ? <button className="mini-add" onClick={() => add(product.id, firstVariant.id)} aria-label={`Add ${product.name} to bag`} title={price===null?"Add to quote bag":"Add to bag"}><Plus size={20}/></button> : <Link href={`/products/${product.slug}`} className="mini-add" aria-label={`View ${product.name}`}><ArrowUpRight size={18}/></Link>}
      </div>
    </div>
  </article>;
}