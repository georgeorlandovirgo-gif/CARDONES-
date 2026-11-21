import {unstable_noStore as noStore} from "next/cache";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import {RelatedCollection} from "@/components/RelatedCollection";
import { products, productBySlug } from "@/lib/catalog";
import { catalog } from "@/lib/server/store";
async function getProduct(slug:string){ if(process.env.NEXT_PUBLIC_STORE_DEMO === "1")return productBySlug(slug);noStore();try{return (await catalog()).find(p=>p.slug===slug);}catch{return productBySlug(slug);} }
export function generateStaticParams() { return products.map((product)=>({slug:product.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const product=await getProduct(slug);return {title:product?.name||"Product not found",description:product?.description};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=await getProduct(slug);if(!product)notFound();return <><section className="section detail-section"><ProductDetail product={product}/></section><section className="section more-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">MAKE IT A ROUTINE</span><h2>Pair it with <em>something lovely.</em></h2></div></div><RelatedCollection exclude={product.id}/></div></section></>}