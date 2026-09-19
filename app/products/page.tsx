'use client';
import {useSearchParams} from 'next/navigation';
import {Suspense,useEffect,useMemo,useState} from 'react';
import {Header,Footer,ProductCard} from '../components';
import {paginate} from '../pagination';
import {useStore} from '../providers';

function Results(){
  const params=useSearchParams();
  const {products,categories,catalogStatus,refreshCatalog}=useStore();
  const [q,setQ]=useState(params.get('q')||'');
  const [brand,setBrand]=useState('');
  const [category,setCategory]=useState(params.get('category')||'');
  const [max,setMax]=useState<number|null>(null);
  const [sort,setSort]=useState('featured');
  const [position,setPosition]=useState({key:'',page:1});
  const parameterCategory=params.get('category')||'';
  useEffect(()=>setCategory(parameterCategory),[parameterCategory]);
  const parameterQuery=params.get('q')||'';
  useEffect(()=>setQ(parameterQuery),[parameterQuery]);
  const priceFloor=products.length?Math.min(...products.map((p)=>p.price)):0;
  const priceCeiling=products.length?Math.max(...products.map((p)=>p.price)):0;
  const selectedMaximum=max??priceCeiling;
  const list=useMemo(()=>products.filter((p)=>(p.name+' '+p.brand).toLowerCase().includes(q.toLowerCase())&&(!brand||p.brand===brand)&&(!category||p.category===category)&&p.price<=selectedMaximum).sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:0),[products,q,brand,category,selectedMaximum,sort]);
  const filterKey=JSON.stringify([q,brand,category,selectedMaximum,sort]);
  useEffect(()=>setPosition({key:filterKey,page:1}),[filterKey]);
  const result=paginate(list,position.key===filterKey?position.page:1);
  const go=(page:number)=>{setPosition({key:filterKey,page});window.scrollTo({top:0,behavior:'smooth'});};
  if(catalogStatus==='loading')return <main className="container section empty">جارٍ تحميل الكتالوج…</main>;
  if(catalogStatus==='error')return <main className="container section empty"><h2>تعذر تحميل الكتالوج</h2><button className="btn" onClick={()=>void refreshCatalog().catch(()=>{})}>إعادة المحاولة</button></main>;
  return <main className="container section"><div className="title-row"><div><span className="brand">المتجر</span><h2>كل المنتجات</h2></div><span className="muted">{list.length} منتجات</span></div><div className="filters"><div className="field"><label htmlFor="q">بحث</label><input id="q" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="اسم المنتج أو الماركة"/></div><div className="field"><label htmlFor="brand">الماركة</label><select id="brand" value={brand} onChange={(e)=>setBrand(e.target.value)}><option value="">الكل</option>{[...new Set(products.map((p)=>p.brand))].map((x)=><option key={x}>{x}</option>)}</select></div><div className="field"><label htmlFor="category">الفئة</label><select id="category" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">الكل</option>{categories.map((x)=><option key={x}>{x}</option>)}</select></div><div className="field"><label htmlFor="maximum">السعر حتى {selectedMaximum.toLocaleString('ar-IQ')} د.ع</label><input id="maximum" type="range" min={priceFloor} max={priceCeiling} step="1000" value={selectedMaximum} disabled={!products.length||priceFloor===priceCeiling} onChange={(e)=>setMax(Number(e.target.value))}/></div><div className="field"><label htmlFor="sort">الترتيب</label><select id="sort" value={sort} onChange={(e)=>setSort(e.target.value)}><option value="featured">مختارة</option><option value="low">الأقل سعراً</option><option value="high">الأعلى سعراً</option></select></div></div>{list.length?<div className="grid">{result.items.map((p)=><ProductCard p={p} key={p.id}/>)}</div>:<div className="empty"><h3>لم نجد نتائج مطابقة</h3><p>جرّبي تغيير البحث أو إزالة بعض الفلاتر.</p><button className="btn" onClick={()=>{setQ('');setBrand('');setCategory('');setMax(null)}}>إعادة ضبط الفلاتر</button></div>}{result.total>1&&<nav aria-label="صفحات المنتجات" className="pagination"><button className="choice" disabled={result.page===1} onClick={()=>go(result.page-1)}>السابق</button>{result.pages.map(n=><button key={n} className={n===result.page?'btn':'choice'} aria-current={n===result.page?'page':undefined} aria-label={`الصفحة ${n}`} onClick={()=>go(n)}>{n}</button>)}<button className="choice" disabled={result.page===result.total} onClick={()=>go(result.page+1)}>التالي</button><span role="status">صفحة {result.page} من {result.total}</span></nav>}</main>;
}
export default function Products(){return <><Header/><Suspense fallback={<main className="container section">جارٍ تحميل المنتجات…</main>}><Results/></Suspense><Footer/></>}

