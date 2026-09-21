'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Product } from './data';
import {addCartQuantity,CartItem,changeCartLine,readCartStorage,reconcileCart,removeCartLine,sanitizeProduct,updateDeliveryFee,writeCartStorage} from './store-utils';
export {cartLineKey,parseStoredCart} from './store-utils';

type Store = {
  items: CartItem[];
  products: Product[];
  categories: string[];
  deliveryFees: Record<string, number>;
  add: (product: Product, shade?: string, size?: string, quantity?:number) => {added:number;error?:string};
  change: (lineKey: string, quantity: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setDeliveryFee: (province: string, fee: number) => void;
  refreshCatalog: () => Promise<void>;
  catalogStatus: 'loading'|'ready'|'error';
};

const StoreContext = createContext<Store | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [categories,setCategories]=useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<Record<string,number>>({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [catalogStatus,setCatalogStatus]=useState<'loading'|'ready'|'error'>('loading');

  const refreshCatalog=useCallback(async()=>{setCatalogStatus('loading');try{const response=await fetch('/api/catalog');if(!response.ok)throw new Error('catalog');const catalog=await response.json() as {products:Product[];categories:string[];deliveryFees:Record<string,number>};setProducts(catalog.products);setCategories(catalog.categories);setDeliveryFees(catalog.deliveryFees);setItems((current)=>reconcileCart(current,catalog.products));setCatalogStatus('ready')}catch(error){setCatalogStatus('error');throw error}},[]);

  useEffect(() => {
    setItems(readCartStorage(window.localStorage));
    setCartLoaded(true);
    void refreshCatalog().catch(()=>{/* Preserve the stored cart unchanged when the catalogue cannot load. */});
  }, [refreshCatalog]);

  useEffect(() => {
    if (!cartLoaded) return;
    writeCartStorage(window.localStorage,items);
  }, [items, cartLoaded]);

  const add = useCallback((product: Product, shade = product.shades[0], size = product.sizes[0],quantity=1) => {const result=addCartQuantity(items,product,shade,size,quantity);if(result.added)setItems(result.items);return {added:result.added,error:result.error}}, [items]);

  const change = useCallback((lineKey: string, quantity: number) => {
    setItems((current) => changeCartLine(current,lineKey,quantity));
  }, []);

  const remove = useCallback((lineKey: string) => {
    setItems((current) => removeCartLine(current,lineKey));
  }, []);

  const saveProduct = useCallback((product: Product) => {
    const clean = sanitizeProduct(product);
    const exists = products.some((item) => item.id === clean.id);
    const nextProducts = exists ? products.map((item) => (item.id === clean.id ? clean : item)) : [...products, clean];
    setProducts(nextProducts);
    setItems((current) => reconcileCart(current,nextProducts));
  }, [products]);

  const deleteProduct = useCallback((id: string) => {
    const nextProducts = products.filter((item) => item.id !== id);
    setProducts(nextProducts);
    setItems((current) => reconcileCart(current,nextProducts));
  }, [products]);

  const value = useMemo<Store>(
    () => ({
      items,
      products,
      categories,
      deliveryFees,
      add,
      change,
      remove,
      clear: () => setItems([]),
      saveProduct,
      deleteProduct,
      setDeliveryFee: (province, fee) =>
        setDeliveryFees((current) => updateDeliveryFee(current,province,fee)),
      refreshCatalog,
      catalogStatus,
    }),
    [items, products, categories, deliveryFees, add, change, remove, saveProduct, deleteProduct, refreshCatalog,catalogStatus],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('Store provider is missing');
  return context;
};

export const useCart = useStore;

