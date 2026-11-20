'use client';
import {useEffect,useRef} from 'react';
export function useDialog(open:boolean,onClose:()=>void){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement|null;
  const bodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const focusables=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex="0"]')||[]).filter(x=>x.getClientRects().length>0);
  focusables()[0]?.focus();
  function key(e:KeyboardEvent){
   if(e.key==='Escape'){e.preventDefault();onClose();}
   if(e.key==='Tab'){const nodes=focusables();const first=nodes[0],last=nodes[nodes.length-1];if(!first)return;
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  }
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=bodyOverflow;previous?.focus();};
 },[open]);
 return ref;
}
