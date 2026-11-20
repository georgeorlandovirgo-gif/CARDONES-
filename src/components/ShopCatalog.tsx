"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { type Collection } from "@/lib/catalog";
import { useCatalog } from "@/components/CatalogProvider";
const filters: Array<"All oils" | Collection> = ["All oils", "Hair", "Skin", "Multipurpose"];
export function ShopCatalog(){
 const products=useCatalog();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All oils");
  const [search, setSearch] = useState("");
  const visible = useMemo(()=>products.filter((p)=>{
    const query = search.trim().toLowerCase();
    return (filter === "All oils" || p.category.includes(filter)) && (!query || `${p.name} ${p.subtitle} ${p.benefits.join(" ")}`.toLowerCase().includes(query));
  }),[filter,search,products]);
  return <><div className="shop-controls"><div className="shop-filters"><SlidersHorizontal size={17}/>{filters.map(f=><button key={f} className={f===filter?"selected":""} aria-pressed={f===filter} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className="shop-search"><Search size={18}/><input aria-label="Search oils" placeholder="Search the collection" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch("")}><X size={15}/></button>}</div></div>
    <p className="results-count">SHOWING {visible.length} {visible.length===1?"OIL":"OILS"}</p><div className="product-grid shop-grid">{visible.map(p=><ProductCard key={p.id} product={p}/>)}</div>{visible.length===0&&<div className="no-results"><h3>Nothing in this part of the collection yet.</h3><p>Try another search or browse all oils.</p><button className="button button-dark" onClick={()=>{setFilter("All oils");setSearch("")}}>View all oils</button></div>}</>;
}