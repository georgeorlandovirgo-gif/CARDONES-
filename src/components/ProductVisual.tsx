import Image from "next/image";
import { Leaf } from "lucide-react";
import type { Product } from "@/lib/catalog";

export function ProductVisual({ product, priority = false, mode = "card" }: { product: Product; priority?: boolean; mode?: "card" | "detail" }) {
  return <div className={`product-visual product-visual--${product.accent} product-visual--${mode}`}>
    <div className="product-visual-shine" />
    {product.image ? <div className="product-label-art"><Image src={product.image} alt={`Cardone’s ${product.name} luxury label artwork`} fill sizes={mode === "detail" ? "(max-width: 800px) 85vw, 600px" : "(max-width: 800px) 80vw, 400px"} priority={priority}/></div> :
      <div className="product-placeholder"><Leaf size={48} strokeWidth={1}/><span>CARDONE’S</span><strong>{product.name}</strong><small>THE BOTANICAL COLLECTION</small></div>}
    <span className="product-visual-bottom">THE CARDONE’S COLLECTION</span>
  </div>;
}