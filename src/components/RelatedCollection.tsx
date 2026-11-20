'use client';
import {useCatalog} from './CatalogProvider';
import {ProductCard} from './ProductCard';
export function RelatedCollection({exclude}:{exclude:string}){const products=useCatalog();return <div className="product-grid">{products.filter(p=>p.id!==exclude).slice(0,3).map(p=><ProductCard key={p.id} product={p}/>)}</div>;}
