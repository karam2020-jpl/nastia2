'use client';

import Link from 'next/link';
import { Menu, Minus, Plus, Search, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { money, Product } from './data';
import { cartLineKey, useStore } from './providers';

export function Header() {
  const { items } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery,setSearchQuery]=useState('');
  const router=useRouter();
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);

  return (
    <>
      <div className="topnote">
        <Truck size={14} aria-hidden="true" /> التوصيل إلى جميع محافظات العراق
      </div>
      <header className="header">
        <div className="container head">
          <Link className="logo" href="/">Nastia Beauty</Link>
          <form className="search" onSubmit={(event)=>{event.preventDefault();router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`)}}>
            <Search size={18} aria-hidden="true" />
            <input name="q" value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} aria-label="البحث" placeholder="ابحثي عن منتج أو ماركة" />
          </form>
          <nav className="nav" aria-label="التنقل الرئيسي">
            <Link className="desktop-link" href="/products">المنتجات</Link>
            <Link aria-label="السلة" className="cart-pill" href="/cart">
              <ShoppingBag />
              <span className="badge">{items.reduce((sum, item) => sum + item.qty, 0)}</span>
            </Link>
            <button
              ref={menuButton}
              type="button"
              className="menu-button"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </nav>
        </div>
        {menuOpen && (
          <nav id="mobile-menu" className="mobile-menu" aria-label="قائمة الهاتف">
            <Link href="/" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
            <Link href="/products" onClick={() => setMenuOpen(false)}>المنتجات</Link>
            <Link href="/cart" onClick={() => setMenuOpen(false)}>السلة</Link>
          </nav>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div><div className="logo" style={{ color: 'white' }}>Nastia Beauty</div><p>اختيارات عالمية للجمال، بواجهة عراقية أنيقة.</p></div>
        <div><b>التوصيل</b><p>التوصيل إلى جميع محافظات العراق</p><p>يُحفظ طلبك بأمان بعد التحقق من المخزون والتوصيل.</p></div>
      </div>
    </footer>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useStore();
  const [message,setMessage]=useState('');
  return (
    <article className="card">
      <Link href={`/products/${p.id}`}><div className="product-art" style={{ '--c': p.color } as React.CSSProperties}>{p.images?.[0] ? <img className="product-cover" src={p.images[0].url} alt={p.name} loading="lazy"/> : <span />}</div></Link>
      <div className="cardbody">
        <span className="brand">{p.brand}</span>
        <Link href={`/products/${p.id}`}><h3>{p.name}</h3></Link>
        <span className="price">{money(p.price)}</span>
        <button className="btn" onClick={() => {const result=add(p);setMessage(result.added?'تمت الإضافة إلى السلة':result.error||'تعذرت الإضافة')}} disabled={p.stock === 0}>
          <ShoppingBag size={16} /> {p.stock ? 'أضيفي للسلة' : 'نفد المخزون'}
        </button>
        {message&&<small className="added-message" role="status">{message}</small>}
      </div>
    </article>
  );
}

export function Quantity({ item }: { item: { product: Product; shade: string; size: string; qty: number } }) {
  const { change } = useStore();
  const key = cartLineKey(item.product.id, item.shade, item.size);
  return (
    <div className="quantity">
      <button type="button" aria-label="زيادة" onClick={() => change(key, item.qty + 1)}><Plus size={15} /></button>
      <b>{item.qty}</b>
      <button type="button" aria-label="إنقاص" onClick={() => change(key, item.qty - 1)}><Minus size={15} /></button>
    </div>
  );
}

export function Remove({ productId, shade, size }: { productId: string; shade: string; size: string }) {
  const { remove } = useStore();
  return <button type="button" aria-label="حذف هذا الخيار من السلة" onClick={() => remove(cartLineKey(productId, shade, size))} className="choice"><Trash2 size={16} /></button>;
}

