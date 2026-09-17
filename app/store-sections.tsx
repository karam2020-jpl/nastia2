'use client';
import Link from 'next/link';
import { ProductCard } from './components';
import { useStore } from './providers';

export function FeaturedProducts() {
  const { products } = useStore();
  return <section className="section"><div className="title-row"><h2>مختارات Nastia Beauty</h2><Link href="/products">عرض الكل ←</Link></div><div className="grid">{products.slice(0,4).map((product) => <ProductCard p={product} key={product.id} />)}</div></section>;
}
