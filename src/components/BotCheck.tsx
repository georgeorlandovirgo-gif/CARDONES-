'use client';
import Script from 'next/script';
import {useEffect,useRef,useState} from 'react';
type Turnstile={render:(node:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void};
declare global {interface Window {turnstile?:Turnstile}}
export function BotCheck({action,onToken,reset}:{action:string;onToken:(token:string)=>void;reset:number}){
 const node=useRef<HTMLDivElement>(null),callback=useRef(onToken);callback.current=onToken;
 const [ready,setReady]=useState(false),[error,setError]=useState('');
 const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 useEffect(()=>{if(!ready||!key||!node.current||!window.turnstile)return;callback.current('');setError('');
 const api=window.turnstile,id=api.render(node.current,{sitekey:key,action,callback:(token:string)=>callback.current(token),'expired-callback':()=>callback.current(''),'error-callback':()=>{callback.current('');setError('Security check unavailable. Please retry.');}});
 return()=>{api.remove(id);};},[ready,key,action,reset]);
 if(!key)return <p role="status">Secure checkout is not configured yet. Please contact Cardone’s.</p>;
 return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)} onError={()=>setError('Unable to load the security check. Please reload this page.')}/><div ref={node}/>{error&&<p role="alert">{error}</p>}</>;
}
