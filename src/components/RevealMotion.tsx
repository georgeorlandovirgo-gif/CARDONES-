"use client";
import { useEffect } from "react";
export function RevealMotion(){
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const elements=document.querySelectorAll(".product-card,.collection-intro,.ritual-edit-text,.founders-band-inner,.ritual-note-inner,.lifestyle-story-copy,.contact-card");
  if(!("IntersectionObserver" in window))return;
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}});
  },{rootMargin:"0px 0px -25px 0px",threshold:0.03});
  elements.forEach(el=>{el.classList.add("reveal-init");observer.observe(el)});
  return ()=>observer.disconnect();
 },[]);
 return null;
}
