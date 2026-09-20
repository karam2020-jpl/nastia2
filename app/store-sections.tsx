'use client';
import Link from 'next/link';
import {useState} from 'react';
import { ProductCard } from './components';
import { useStore } from './providers';

export function FeaturedProducts() {
  const { products,catalogStatus,refreshCatalog } = useStore();
  if(catalogStatus==='loading')return <section className="section empty">جارٍ تحميل المنتجات…</section>;
  if(catalogStatus==='error')return <section className="section empty"><p>تعذر تحميل المنتجات.</p><button className="btn" onClick={()=>void refreshCatalog().catch(()=>{})}>إعادة المحاولة</button></section>;
  return <section className="section"><div className="title-row"><h2>مختارات Nastia Beauty</h2><Link href="/products">عرض الكل ←</Link></div><div className="grid">{products.slice(0,4).map((product) => <ProductCard p={product} key={product.id} />)}</div></section>;
}


export function BrandShowcase() {
  const {products,catalogStatus}=useStore();
  const [paused,setPaused]=useState(false);
  const brands=[...new Set(products.map(p=>p.brand).filter(name=>name.trim()))];
  if(catalogStatus==='loading' && !products.length)return null;
  if(!brands.length)return null;
  const moving=brands.length>3;
  return <section className="section brand-showcase" aria-labelledby="brands-title">
    <div className="title-row"><div><span className="brand">اختاري ما يناسبك</span><h2 id="brands-title">تسوّقي حسب الماركة</h2><p className="muted">ماركاتك المفضلة، في مكان واحد</p></div>
      {moving&&<button className="choice brand-motion-toggle" type="button" aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused?'تشغيل الحركة':'إيقاف الحركة'}</button>}
    </div>
    <div className={`brand-window ${moving?'is-moving':''} ${paused?'is-paused':''}`}>
      <div className="brand-track">
        <div className="brand-group">{brands.map(name=><Link className="brand-tile" key={name} href={'/products?brand='+encodeURIComponent(name)}><strong dir="auto">{name}</strong><span>اكتشفي المنتجات ←</span></Link>)}</div>
        {moving&&<div className="brand-group brand-copy" aria-hidden="true">{brands.map(name=><Link tabIndex={-1} className="brand-tile" key={name} href={'/products?brand='+encodeURIComponent(name)}><strong dir="auto">{name}</strong><span>اكتشفي المنتجات ←</span></Link>)}</div>}
      </div>
    </div>
  </section>;
}
