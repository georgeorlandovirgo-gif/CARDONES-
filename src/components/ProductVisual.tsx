import Image from "next/image";
import { assetUrl } from "@/lib/asset-url";
import { Leaf } from "lucide-react";
import type { Product } from "@/lib/catalog";

type View = "bottle" | "label";
export function ProductVisual({ product, priority = false, mode = "card", view = "bottle" }: { product: Product; priority?: boolean; mode?: "card" | "detail"; view?: View }) {
  const showLabel = view === "label" && !!product.labelImage;
  const src = showLabel ? product.labelImage : product.image;
  return <div className={`product-visual product-visual--${product.accent} product-visual--${mode}`}>
    <div className="product-visual-shine" />
    {src ? <div className={showLabel ? "product-label-art" : "product-bottle-art"}>
      <Image src={assetUrl(src)} unoptimized={src.startsWith("https://")} alt={showLabel ? `Full Cardone’s ${product.name} luxury label design` : `Cardone’s ${product.name} glass bottle mockup with actual luxury label artwork`} fill sizes={mode === "detail" ? "(max-width: 800px) 85vw, 600px" : "(max-width: 800px) 80vw, 400px"} priority={priority}/>
    </div> : <div className="product-placeholder"><Leaf size={48} strokeWidth={1}/><span>CARDONE’S</span><strong>{product.name}</strong><small>THE BOTANICAL COLLECTION</small></div>}
    <span className="product-visual-bottom">{showLabel ? "YOUR CARDONE’S LABEL DESIGN" : "THE CARDONE’S COLLECTION"}</span>
  </div>;
}