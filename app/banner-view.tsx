import Link from 'next/link';
import type {BannerSettings} from './banner-settings';
export default function BannerView({settings, preview = false}: {settings: BannerSettings; preview?: boolean}) {
  const image = settings.desktopImage || settings.mobileImage;
  return <section className={`hero homepage-hero ${image ? 'has-image' : ''}`}>
    {image && <picture className="banner-picture">
      {settings.mobileImage && <source media="(max-width: 800px)" srcSet={settings.mobileImage}/>}
      <img src={image} alt={settings.imageAlt} fetchPriority="high"/>
    </picture>}
    <div className="banner-copy"><span className="brand">Nastia Beauty</span>
      <h1>{settings.title}</h1><p>{settings.subtitle}</p>
      {preview ? <span className="btn">{settings.buttonText}</span> : <Link className="btn" href={settings.buttonHref}>{settings.buttonText}</Link>}
    </div>
    {!image && <div className="bottles" aria-label="رسم تجريدي لمنتجات عناية"><i className="bottle"/><i className="bottle"/><i className="bottle"/></div>}
  </section>;
}
