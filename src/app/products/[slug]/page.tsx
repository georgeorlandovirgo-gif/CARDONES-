import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { products, productBySlug } from "@/lib/catalog";
export function generateStaticParams() { return products.map((product)=>({slug:product.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const product=productBySlug(slug);return {title:product?.name||"Product not found",description:product?.description};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=productBySlug(slug);if(!product)notFound(); const more=products.filter(p=>p.id!==product.id).slice(0,3);return <><section className="section detail-section"><ProductDetail product={product}/></section><section className="section more-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">MAKE IT A RITUAL</span><h2>Pair it with <em>something lovely.</em></h2></div></div><div className="product-grid">{more.map(p=><ProductCard key={p.id} product={p}/>)}</div></div></section></>}