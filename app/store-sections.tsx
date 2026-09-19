'use client';
import Link from 'next/link';
import { ProductCard } from './components';
import { useStore } from './providers';

export function FeaturedProducts() {
  const { products,catalogStatus,refreshCatalog } = useStore();
  if(catalogStatus==='loading')return <section className="section empty">جارٍ تحميل المنتجات…</section>;
  if(catalogStatus==='error')return <section className="section empty"><p>تعذر تحميل المنتجات.</p><button className="btn" onClick={()=>void refreshCatalog().catch(()=>{})}>إعادة المحاولة</button></section>;
  return <section className="section"><div className="title-row"><h2>مختارات Nastia Beauty</h2><Link href="/products">عرض الكل ←</Link></div><div className="grid">{products.slice(0,4).map((product) => <ProductCard p={product} key={product.id} />)}</div></section>;
}
