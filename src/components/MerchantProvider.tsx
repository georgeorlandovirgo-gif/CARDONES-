'use client';
import {parishes} from '@/lib/commerce';
import {createContext,useContext,useEffect,useState} from 'react';
export type PublicMerchant={
 availableParishes:string[];phone:string|null;whatsapp:string|null;email:string|null;instagram:string|null;facebook:string|null;
 location:string|null;contactHours:string|null;
 payment:{bankTransfer:boolean;cash:boolean;whatsapp:boolean;bank:{name:string|null;holder:string|null;account:string|null;branch:string|null;type:string|null;instructions:string|null}|null};
 delivery:boolean;pickup:boolean;deliveryInformation:string|null;pickupInformation:string|null;deliveryFeeJmd:number|null;paused:boolean;policies:string|null;
};
const empty:PublicMerchant={availableParishes:[...parishes],phone:null,whatsapp:null,email:null,instagram:null,facebook:null,location:'St. Elizabeth, Jamaica',contactHours:null,
 payment:{bankTransfer:false,cash:false,whatsapp:false,bank:null},delivery:true,pickup:true,deliveryInformation:null,pickupInformation:null,deliveryFeeJmd:null,paused:true,policies:null};
const C=createContext<PublicMerchant>(empty);
export const useMerchant=()=>useContext(C);
export function MerchantProvider({children}:{children:React.ReactNode}){
 const [value,setValue]=useState(empty);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_STORE_DEMO==='1')return;let active=true;
 const refresh=()=>fetch('/api/settings',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(active)setValue(d);}).catch(()=>{});
 void refresh();const interval=window.setInterval(refresh,60000);window.addEventListener('focus',refresh);window.addEventListener('cardones:updated',refresh);
 return ()=>{active=false;clearInterval(interval);window.removeEventListener('focus',refresh);window.removeEventListener('cardones:updated',refresh);};},[]);
 return <C.Provider value={value}>{children}</C.Provider>;
}