'use client';

import Link from 'next/link';
import { Menu, Minus, Plus, Search, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { money, Product } from './data';
import { cartLineKey, useStore } from './providers';

export function Header() {
  const { items } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
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
        <Truck size={14} aria-hidden="true" /> توصيل متاح إلى بغداد، البصرة، أربيل، النجف،
        كربلاء ونينوى • الدفع عند الاستلام
      </div>
      <header className="header">
        <div className="container head">
          <Link className="logo" href="/">nastia</Link>
          <form className="search" action="/products">
            <Search size={18} aria-hidden="true" />
            <input name="q" aria-label="البحث" placeholder="ابحثي عن منتج أو ماركة" />
          </form>
          <nav className="nav" aria-label="التنقل الرئيسي">
            <Link className="desktop-link" href="/products">المنتجات</Link>
            <Link className="desktop-link" href="/admin">الإدارة</Link>
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
            <Link href="/admin" onClick={() => setMenuOpen(false)}>لوحة الإدارة التجريبية</Link>
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
        <div><div className="logo" style={{ color: 'white' }}>nastia</div><p>اختيارات عالمية للجمال، بواجهة عراقية أنيقة.</p></div>
        <div><b>الدفع والتوصيل</b><p>الدفع عند الاستلام فقط</p><p>هذه نسخة عرض تجريبية — لا تُرسل طلبات حقيقية.</p></div>
      </div>
    </footer>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useStore();
  return (
    <article className="card">
      <Link href={`/products/${p.id}`}><div className="product-art" style={{ '--c': p.color } as React.CSSProperties}><span /></div></Link>
      <div className="cardbody">
        <span className="brand">{p.brand}</span>
        <Link href={`/products/${p.id}`}><h3>{p.name}</h3></Link>
        <span className="price">{money(p.price)}</span>
        <button className="btn" onClick={() => add(p)} disabled={p.stock === 0}>
          <ShoppingBag size={16} /> {p.stock ? 'أضيفي للسلة' : 'نفد المخزون'}
        </button>
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
