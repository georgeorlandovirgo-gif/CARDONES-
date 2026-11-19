import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { assetUrl } from "@/lib/asset-url";
import { ShopCatalog } from "@/components/ShopCatalog";
export const metadata:Metadata = {title:"Our Botanical Oil Collection",description:"Discover Cardone's luxury collection of botanical hair and skin oils, presented in amber glass."};
export default function ShopPage(){return <><section className="page-hero shop-hero luxury-shop-hero" style={{"--shop-photo": `url(${assetUrl("/images/cardones-hero-campaign.webp")})`} as CSSProperties}><div className="container"><span className="eyebrow">THE CARDONE’S BOTANICAL COLLECTION / 01—06</span><h1>An oil for <em>every ritual.</em></h1><p>Explore carefully presented botanical oils for hair, skin, and daily care. Discover your favourites and new additions to the collection.</p></div></section><section className="section shop-section"><div className="container"><ShopCatalog/></div></section></>}