import Link from 'next/link';
import HeroCarousel from './hero-carousel';
import Reveal from './reveal';
import {db, readBannerSlides} from './lib/banner';
import {Header,Footer} from './components';
import {categoryDetails} from './category-store';
import {FeaturedProducts,BrandShowcase} from './store-sections';
import {defaultBanner} from './banner-settings';
import {categoryArtwork} from './theme-art';
export const dynamic = 'force-dynamic';
export default function Home(){
 const categories=categoryDetails(db);
 const presentation=process.env.NASTIA_PRESENTATION!=='0';
 const slides=presentation?[{...defaultBanner,title:'جمالكِ،\nبتفاصيل مختارة',subtitle:'منتجات فاخرة مختارة… لأنكِ تستحقين الأفضل دائماً',buttonText:'تسوّقي الآن ←',desktopImage:'/design/rose-hero.webp',mobileImage:'/design/rose-hero.webp',imageAlt:'تشكيلة مستحضرات تجميل على الحرير الوردي'}]:readBannerSlides(db);
 return <><Header/><main className="rose-storefront"><div className="container"><HeroCarousel slides={slides}/><Reveal><section className="section category-section" aria-label="تسوّقي حسب القسم"><div className="catgrid">{categories.map(c=>{const art=categoryArtwork(c.name);return <Link className="cat" href={'/products?category='+encodeURIComponent(c.name)} key={c.name}>{art&&presentation?<span className={'category-photo art-'+art.slot}/>:c.image?<img className="category-icon" src={c.image} alt=""/>:<span className="category-placeholder">{c.name.slice(0,1)}</span>}<strong>{c.name}</strong><small>{art?.caption||'اكتشفي مجموعتنا المختارة'}</small></Link>})}</div></section></Reveal><Reveal><BrandShowcase/></Reveal><Reveal><FeaturedProducts/></Reveal></div></main><Footer/></>;
}
