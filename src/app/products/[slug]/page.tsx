import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/catalog";
import { loadCatalog } from "@/lib/server/database";
export function generateStaticParams(){return products.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;
 const product=(await loadCatalog()).find(p=>p.slug===slug);
 return {title:product?.name||"Product unavailable",description:product?.description};
}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const catalog=await loadCatalog();
 const product=catalog.find(p=>p.slug===slug);
 if(!product)notFound();
 const related=catalog.filter(p=>p.id!==product.id).slice(0,3);
 return <><section className="section detail-section"><ProductDetail product={product}/></section>
 <section className="section more-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">COMPLETE YOUR RITUAL</span><h2>Beautifully <em>paired.</em></h2></div></div><div className="product-grid">{related.map(p=><ProductCard key={p.id} product={p}/>)}</div></div></section></>;
}
