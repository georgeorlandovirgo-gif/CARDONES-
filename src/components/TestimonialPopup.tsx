'use client';
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import {X,Quote} from 'lucide-react';
import type {CustomerStory} from '@/lib/testimonials';
export function TestimonialPopup(){
 const [stories,setStories]=useState<CustomerStory[]>([]),[index,setIndex]=useState(-1),[dismissed,setDismissed]=useState(false);const paused=useRef(false);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_STORE_DEMO==='1')return;try{if(sessionStorage.getItem('cardones:stories-dismissed'))return;}catch{}let active=true;fetch('/api/testimonials',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(x=>{if(active&&x?.stories)setStories(x.stories);}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>{if(!stories.length||dismissed)return;let next=0;const tick=()=>{if(document.hidden||paused.current)return;setIndex(next);next=(next+1)%stories.length;};const first=setTimeout(tick,10000);const timer=setInterval(tick,20000);return()=>{clearTimeout(first);clearInterval(timer);};},[stories,dismissed]);
 const s=stories[index];if(!s||dismissed)return null;
 return <aside className="testimonial-popup" aria-label="Customer testimonial" onMouseEnter={()=>{paused.current=true;}} onMouseLeave={()=>{paused.current=false;}} onFocus={()=>{paused.current=true;}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))paused.current=false;}}><button className="testimonial-close" aria-label="Dismiss testimonials for this visit" onClick={()=>{setDismissed(true);try{sessionStorage.setItem('cardones:stories-dismissed','1');}catch{}}}><X size={18}/></button><span className="eyebrow"><Quote size={14}/> FROM OUR COMMUNITY</span><p className="popup-quote">“{s.story.length>170?s.story.slice(0,167)+'…':s.story}”</p><strong>{s.display_name}</strong><span className="popup-product">{s.product_name}</span><Link href="/testimonials">Read customer stories →</Link></aside>;
}
