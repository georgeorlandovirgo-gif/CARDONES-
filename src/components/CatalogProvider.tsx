'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {products as defaults,type Product} from '@/lib/catalog';
const Context=createContext<Product[]>(defaults);
export const useCatalog=()=>useContext(Context);
export function CatalogProvider({children}:{children:React.ReactNode}){
 const [data,setData]=useState<Product[]>(defaults);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_STORE_DEMO==='1')return;
 let active=true;fetch('/api/catalog',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(result=>{
  if(active&&Array.isArray(result.products))setData(result.products);
 }).catch(()=>{});return ()=>{active=false;};},[]);
 return <Context.Provider value={data}>{children}</Context.Provider>;
}