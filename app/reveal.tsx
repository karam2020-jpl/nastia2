'use client';
import {useEffect,useRef} from 'react';
export default function Reveal({children}:{children:React.ReactNode}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const element=ref.current;if(!element||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){element.classList.add('reveal-enter');observer.disconnect();}},{threshold:.08});observer.observe(element);return()=>observer.disconnect();},[]);return <div ref={ref}>{children}</div>;}
