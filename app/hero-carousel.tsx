'use client';
import {useEffect,useRef,useState} from 'react';
import BannerView from './banner-view';
import type {BannerSettings} from './banner-settings';
export default function HeroCarousel({slides}:{slides:BannerSettings[]}){
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[hidden,setHidden]=useState(false),[reduced,setReduced]=useState(true);
 const touch=useRef<{x:number;y:number}|null>(null);const count=slides.length;const current=index%count;
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);const visibility=()=>setHidden(document.hidden);update();visibility();media.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{if(count<2||paused||hover||focus||hidden||reduced)return;const timer=setInterval(()=>setIndex(i=>(i+1)%count),6500);return()=>clearInterval(timer);},[count,paused,hover,focus,hidden,reduced]);
 const go=(n:number)=>{setPaused(true);setIndex((n+count)%count);};
 return <section className="hero-carousel" aria-label="مختارات ناستيا" aria-roledescription="عرض شرائح" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocus(false);}} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();go(current+1);}if(e.key==='ArrowRight'){e.preventDefault();go(current-1);}}} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{const start=touch.current;touch.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy))go(current+(dx>0?1:-1));}}>
 <div className="hero-frame" key={current}><BannerView settings={slides[current]}/></div>
 {count>1&&<div className="carousel-controls"><button type="button" className="choice" onClick={()=>go(current-1)} aria-label="البانر السابق">→</button><div className="carousel-dots">{slides.map((_,i)=><button key={i} type="button" aria-label={`عرض البانر ${i+1}`} aria-current={current===i?'true':undefined} onClick={()=>go(i)}><span/></button>)}</div><button type="button" className="choice" onClick={()=>go(current+1)} aria-label="البانر التالي">←</button><button type="button" className="choice" disabled={reduced} onClick={()=>setPaused(p=>!p)}>{reduced?'الحركة التلقائية معطلة':paused?'تشغيل تلقائي':'إيقاف مؤقت'}</button><span className="muted">{current+1} / {count}</span></div>}
 </section>;
}
