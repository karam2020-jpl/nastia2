'use client';
import {notFound} from 'next/navigation';
import {useState,use} from 'react';
import {Header,Footer} from '../../components';
import {money,Product as ProductType} from '../../data';
import {useStore} from '../../providers';
import {ShoppingBag,Check} from 'lucide-react';

export default function Detail({params}:{params:Promise<{id:string}>}){const {id}=use(params);const {products}=useStore();const product=products.find((item)=>item.id===id);if(!product)return notFound();return <Product p={product}/>}
function Product({p}:{p:ProductType}){const [shade,setShade]=useState(p.shades[0]);const [size,setSize]=useState(p.sizes[0]);const [qty,setQty]=useState(1);const {add}=useStore();const submit=()=>{add(p,shade,size,qty)};return <><Header/><main className="container detail"><div className="product-art detail-art" style={{'--c':p.color} as React.CSSProperties}><span style={{width:150,height:280}}/></div><div><span className="brand">{p.brand} • {p.category}</span><h1>{p.name}</h1><h2 className="price">{money(p.price)}</h2><p>{p.description}</p><p className="muted"><Check size={16} style={{verticalAlign:'middle'}}/> متوفر في المخزون ({p.stock})</p><b>الدرجة</b><div className="choices">{p.shades.map((x)=><button key={x} onClick={()=>setShade(x)} className={'choice '+(shade===x?'active':'')}>{x}</button>)}</div><b>الحجم</b><div className="choices">{p.sizes.map((x)=><button key={x} onClick={()=>setSize(x)} className={'choice '+(size===x?'active':'')}>{x}</button>)}</div><div className="quantity"><button onClick={()=>setQty(Math.min(p.stock,qty+1))}>+</button><b>{qty}</b><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button></div><button className="btn" disabled={!p.stock} onClick={submit}><ShoppingBag size={18}/> أضيفي للسلة</button></div></main><Footer/></>}
