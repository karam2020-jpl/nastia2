'use client';
import {useState} from 'react';
import type {Product} from './data';
export default function ProductGallery({product}:{product:Product}){
  const [selected,setSelected]=useState(0);const images=product.images||[];
  if(!images.length)return <div className="product-art detail-art" style={{'--c':product.color} as React.CSSProperties}><span style={{width:150,height:280}}/></div>;
  return <section className="product-gallery" aria-label="صور المنتج">
    <img className="gallery-main" src={(images[selected]||images[0]).url} alt={product.name}/>
    <div className="gallery-thumbs">{images.map((image,index)=><button type="button" key={image.id} className={index===selected?'selected':''} aria-label={`عرض الصورة ${index+1}`} aria-pressed={index===selected} onClick={()=>setSelected(index)}><img src={image.url} alt=""/></button>)}</div>
  </section>;
}
