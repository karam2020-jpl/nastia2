import BannerView from './banner-view';
import {db, readBanner} from './lib/banner';
export const dynamic = 'force-dynamic';
import Link from 'next/link';import {Header,Footer} from './components';import {categories} from './data';import {FeaturedProducts} from './store-sections';
const icons=['❋','✦','◌','〰'];
export default function Home(){return <><Header/><main><div className="container"><BannerView settings={readBanner(db)}/><section className="section"><div className="title-row"><h2>تسوّقي حسب القسم</h2></div><div className="catgrid">{categories.map((c,i)=><Link className="cat" href={'/products?category='+encodeURIComponent(c)} key={c}><span>{icons[i]}</span>{c}</Link>)}</div></section><FeaturedProducts/></div></main><Footer/></>}
