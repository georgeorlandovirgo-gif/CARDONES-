"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CART_KEY, cleanCart, type CartLine } from "@/lib/cart";
import { products, type Product } from "@/lib/catalog";
import { defaultStoreSettings, type StoreSettings } from "@/lib/store-settings";
export type SelectedVariant = { product: Product; variant: Product["variants"][number] };
type StoreContextValue = {
 lines:CartLine[];count:number;subtotal:number;hasUnpriced:boolean;
 catalog:Product[];settings:StoreSettings;backendReady:boolean;
 cartOpen:boolean;setCartOpen:(open:boolean)=>void;
 findItem:(productId:string,variantId:string)=>SelectedVariant|null;
 add:(productId:string,variantId:string,quantity?:number)=>boolean;
 setQuantity:(productId:string,variantId:string,quantity:number)=>void;
 remove:(productId:string,variantId:string)=>void;
 clear:()=>void;
};
const StoreContext=createContext<StoreContextValue|undefined>(undefined);
const DEMO=process.env.NEXT_PUBLIC_STORE_DEMO==="1";
export function StoreProvider({children}:{children:React.ReactNode}){
 const [lines,setLines]=useState<CartLine[]>([]);
 const [catalog,setCatalog]=useState<Product[]>(products);
 const [settings,setSettings]=useState<StoreSettings>(defaultStoreSettings);
 const [backendReady,setBackendReady]=useState(false);
 const [cartOpen,setCartOpen]=useState(false);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{
  try{setLines(cleanCart(JSON.parse(localStorage.getItem(CART_KEY)||"[]")));}
  catch{setLines([]);}
  setLoaded(true);
 },[]);
 useEffect(()=>{if(loaded)try{localStorage.setItem(CART_KEY,JSON.stringify(lines));}catch{}},[loaded,lines]);
 useEffect(()=>{
  if(DEMO)return;
  const controller=new AbortController();
  fetch("/api/storefront",{cache:"no-store",signal:controller.signal}).then(r=>{if(!r.ok)throw Error("No backend");return r.json();})
   .then(data=>{
     if(Array.isArray(data.products))setCatalog(data.products);
     if(data.settings)setSettings({...defaultStoreSettings,...data.settings});
     setBackendReady(true);
   }).catch(()=>setBackendReady(false));
  return ()=>controller.abort();
 },[]);
 const findItem=useCallback((productId:string,variantId:string):SelectedVariant|null=>{
  const product=catalog.find(p=>p.id===productId);
  const variant=product?.variants.find(v=>v.id===variantId);
  return product&&variant?{product,variant}:null;
 },[catalog]);
 const add=useCallback((productId:string,variantId:string,quantity=1)=>{
  const item=findItem(productId,variantId);
  if(!item || !item.variant.available)return false;
  setLines(prev=>{
   const idx=prev.findIndex(x=>x.productId===productId&&x.variantId===variantId);
   if(idx===-1)return [...prev,{productId,variantId,quantity:Math.min(20,Math.max(1,quantity))}];
   return prev.map((x,i)=>i===idx?{...x,quantity:Math.min(20,x.quantity+quantity)}:x);
  });
  setCartOpen(true);
  return true;
 },[findItem]);
 const setQuantity=useCallback((productId:string,variantId:string,quantity:number)=>{
  setLines(prev=>prev.map(x=>x.productId===productId&&x.variantId===variantId?{...x,quantity:Math.min(20,Math.max(1,quantity))}:x));
 },[]);
 const remove=useCallback((productId:string,variantId:string)=>{
  setLines(prev=>prev.filter(x=>x.productId!==productId||x.variantId!==variantId));
 },[]);
 const clear=useCallback(()=>setLines([]),[]);
 const {count,subtotal,hasUnpriced}=useMemo(()=>lines.reduce((acc,x)=>{
  const item=findItem(x.productId,x.variantId);
  if(!item)return acc;
  acc.count+=x.quantity;
  if(item.variant.priceJmd===null)acc.hasUnpriced=true;
  else acc.subtotal+=item.variant.priceJmd*x.quantity;
  return acc;
 },{count:0,subtotal:0,hasUnpriced:false}),[lines,findItem]);
 return <StoreContext.Provider value={{lines,count,subtotal,hasUnpriced,catalog,settings,backendReady,
  cartOpen,setCartOpen,findItem,add,setQuantity,remove,clear}}>{children}</StoreContext.Provider>;
}
export function useStore(){
 const ctx=useContext(StoreContext);
 if(!ctx)throw Error("useStore requires StoreProvider");
 return ctx;
}
