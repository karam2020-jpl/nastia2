'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {Product} from './data';
type Item={product:Product;qty:number;shade:string;size:string};
type Cart={items:Item[];add:(p:Product,shade?:string,size?:string)=>void;change:(id:string,n:number)=>void;remove:(id:string)=>void;clear:()=>void};
const Context=createContext<Cart|null>(null);
export function Providers({children}:{children:React.ReactNode}){const [items,setItems]=useState<Item[]>([]);const [ready,setReady]=useState(false);useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem('nastia-cart')||'[]'))}finally{setReady(true)}},[]);useEffect(()=>{if(ready)localStorage.setItem('nastia-cart',JSON.stringify(items))},[items,ready]);const add=(product:Product,shade=product.shades[0],size=product.sizes[0])=>setItems(x=>{const old=x.find(i=>i.product.id===product.id&&i.shade===shade&&i.size===size);return old?x.map(i=>i===old?{...i,qty:Math.min(i.qty+1,product.stock)}:i):[...x,{product,qty:1,shade,size}]});const change=(id:string,n:number)=>setItems(x=>x.map(i=>i.product.id===id?{...i,qty:Math.max(1,Math.min(n,i.product.stock))}:i));const remove=(id:string)=>setItems(x=>x.filter(i=>i.product.id!==id));return <Context.Provider value={{items,add,change,remove,clear:()=>setItems([])}}>{children}</Context.Provider>}
export const useCart=()=>{const c=useContext(Context);if(!c)throw Error('Cart provider missing');return c};
