'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {products as defaults,type Product} from '@/lib/catalog';
const Context=createContext<Product[]>(defaults);
export const useCatalog=()=>useContext(Context);
export function CatalogProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Product[]>(defaults);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_STORE_DEMO==='1')return;
 let active=true;const refresh=()=>fetch('/api/catalog',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(result=>{
  if(active&&Array.isArray(result.products))setData(result.products);
 }).catch(()=>{});
 void refresh();const interval=window.setInterval(refresh,60000);window.addEventListener('focus',refresh);window.addEventListener('cardones:updated',refresh);
 return ()=>{active=false;clearInterval(interval);window.removeEventListener('focus',refresh);window.removeEventListener('cardones:updated',refresh);};},[]);
 return <Context.Provider value={data}>{children}</Context.Provider>;
}