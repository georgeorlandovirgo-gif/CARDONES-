'use client';
import {useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {trackablePath} from '@/lib/traffic';
export function TrafficTracker(){const path=usePathname();const last=useRef('');useEffect(()=>{
 if(process.env.NEXT_PUBLIC_STORE_DEMO==='1'||!path||!trackablePath(path)||last.current===path||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 try{const now=Date.now();let session=sessionStorage.getItem('cardones:traffic-session');const seen=Number(sessionStorage.getItem('cardones:traffic-seen')||0);if(!session||now-seen>30*60*1000)session=crypto.randomUUID();sessionStorage.setItem('cardones:traffic-session',session);sessionStorage.setItem('cardones:traffic-seen',String(now));last.current=path;void fetch('/api/traffic',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:crypto.randomUUID(),session,path}),keepalive:true}).catch(()=>{});}catch{}
 },[path]);return null;}
