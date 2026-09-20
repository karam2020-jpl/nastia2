import HeroCarousel from './hero-carousel';
import Reveal from './reveal';
import {db, readBannerSlides} from './lib/banner';
export const dynamic = 'force-dynamic';
import Link from 'next/link';import {Header,Footer} from './components';import {getCategories} from './lib/db';import {FeaturedProducts} from './store-sections';
const icons=['❋','✦','◌','〰'];
export default function Home(){const categories=getCategories();return <><Header/><main><div className="container"><HeroCarousel slides={readBannerSlides(db)}/><Reveal><section className="section"><div className="title-row"><h2>تسوّقي حسب القسم</h2></div><div className="catgrid">{categories.map((c,i)=><Link className="cat" href={'/products?category='+encodeURIComponent(c)} key={c}><span>{icons[i%icons.length]}</span>{c}</Link>)}</div></section></Reveal><Reveal><FeaturedProducts/></Reveal></div></main><Footer/></>}
