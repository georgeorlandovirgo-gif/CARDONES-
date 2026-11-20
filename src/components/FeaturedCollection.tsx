"use client";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/StoreProvider";
export function FeaturedCollection(){
 const {catalog}=useStore();
 return <div className="product-grid luxe-product-grid">{catalog.filter(p=>p.featured).slice(0,6).map((p,i)=><ProductCard key={p.id} product={p} priority={i<3}/>)}</div>;
}
