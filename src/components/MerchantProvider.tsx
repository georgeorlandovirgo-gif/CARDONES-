'use client';
import {createContext,useContext,useEffect,useState} from 'react';
export type PublicMerchant={
 phone:string|null;whatsapp:string|null;email:string|null;instagram:string|null;facebook:string|null;
 location:string|null;contactHours:string|null;
 payment:{bankTransfer:boolean;cash:boolean;whatsapp:boolean;bank:{name:string|null;holder:string|null;account:string|null;branch:string|null;type:string|null;instructions:string|null}|null};
 delivery:boolean;pickup:boolean;deliveryInformation:string|null;pickupInformation:string|null;deliveryFeeJmd:number|null;paused:boolean;policies:string|null;
};
const empty:PublicMerchant={phone:null,whatsapp:null,email:null,instagram:null,facebook:null,location:'St. Elizabeth, Jamaica',contactHours:null,
 payment:{bankTransfer:false,cash:false,whatsapp:false,bank:null},delivery:true,pickup:true,deliveryInformation:null,pickupInformation:null,deliveryFeeJmd:null,paused:false,policies:null};
const C=createContext<PublicMerchant>(empty);
export const useMerchant=()=>useContext(C);
export function MerchantProvider({children}:{children:React.ReactNode}){
 const [value,setValue]=useState(empty);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_STORE_DEMO==='1')return;let active=true;
 fetch('/api/settings',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(active)setValue(d);}).catch(()=>{});
 return ()=>{active=false;};},[]);
 return <C.Provider value={value}>{children}</C.Provider>;
}