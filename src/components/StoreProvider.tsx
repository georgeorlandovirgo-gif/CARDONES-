"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CART_KEY, cleanCart, type CartLine } from "@/lib/cart";
import { useCatalog } from "@/components/CatalogProvider";

type StoreContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hasUnpriced: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  add: (productId: string, variantId: string, quantity?: number) => boolean;
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
};
const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const products=useCatalog();
  const variantById=(productId:string,variantId:string)=>{const product=products.find(p=>p.id===productId);const variant=product?.variants.find(v=>v.id===variantId);return product&&variant?{product,variant}:null;};
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { setLines(cleanCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"))); }
    catch { setLines([]); }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(lines)); }, [loaded, lines]);

  const add = useCallback((productId: string, variantId: string, quantity = 1) => {
    const entry = variantById(productId, variantId);
    if (!entry || !entry.variant.available) return false;
    setLines((prev) => {
      const existing = prev.find((x) => x.productId === productId && x.variantId === variantId);
      if (!existing) return [...prev, { productId, variantId, quantity: Math.min(20, Math.max(1, quantity)) }];
      return prev.map((x) => x === existing ? { ...x, quantity: Math.min(20, x.quantity + quantity) } : x);
    });
    setCartOpen(true);
    return true;
  }, [products]);
  const setQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setLines((prev) => prev.map((x) => x.productId === productId && x.variantId === variantId ? { ...x, quantity: Math.max(1, Math.min(20, quantity)) } : x));
  }, []);
  const remove = useCallback((productId: string, variantId: string) => setLines((prev) => prev.filter((x) => !(x.productId === productId && x.variantId === variantId))), []);
  const clear = useCallback(() => setLines([]), []);
  const { count, subtotal, hasUnpriced } = useMemo(() => lines.reduce((acc, x) => {
    const item = variantById(x.productId, x.variantId);
    if (!item) return acc;
    acc.count += x.quantity;
    if (item.variant.priceJmd === null) acc.hasUnpriced = true;
    else acc.subtotal += x.quantity * item.variant.priceJmd;
    return acc;
  }, { count: 0, subtotal: 0, hasUnpriced: false }), [lines,products]);

  return <StoreContext.Provider value={{ lines, count, subtotal, hasUnpriced, cartOpen, setCartOpen, add, setQuantity, remove, clear }}>
    {children}
  </StoreContext.Provider>;
}
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore requires StoreProvider");
  return ctx;
}