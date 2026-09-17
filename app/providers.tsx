'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { initialDelivery, initialProducts, Product } from './data';
import {addCartLine,CartItem,changeCartLine,readCartStorage,reconcileCart,removeCartLine,sanitizeProduct,updateDeliveryFee,writeCartStorage} from './store-utils';
export {cartLineKey,parseStoredCart} from './store-utils';

type Store = {
  items: CartItem[];
  products: Product[];
  deliveryFees: Record<string, number>;
  add: (product: Product, shade?: string, size?: string) => void;
  change: (lineKey: string, quantity: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setDeliveryFee: (province: string, fee: number) => void;
};

const StoreContext = createContext<Store | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deliveryFees, setDeliveryFees] = useState(initialDelivery);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    setItems(reconcileCart(readCartStorage(window.localStorage),initialProducts));
    setCartLoaded(true);
    fetch('/api/catalog').then((response)=>response.ok?response.json():Promise.reject()).then((catalog:{products:Product[];deliveryFees:Record<string,number>})=>{
      setProducts(catalog.products);
      setDeliveryFees(catalog.deliveryFees);
      setItems((current)=>reconcileCart(current,catalog.products));
    }).catch(()=>{/* Keep seed data available if the local server is temporarily unavailable. */});
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    writeCartStorage(window.localStorage,items);
  }, [items, cartLoaded]);

  const add = useCallback((product: Product, shade = product.shades[0], size = product.sizes[0]) => {
    if (!shade || !size || product.stock < 1) return;
    setItems((current) => addCartLine(current,product,shade,size));
  }, []);

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
      deliveryFees,
      add,
      change,
      remove,
      clear: () => setItems([]),
      saveProduct,
      deleteProduct,
      setDeliveryFee: (province, fee) =>
        setDeliveryFees((current) => updateDeliveryFee(current,province,fee)),
    }),
    [items, products, deliveryFees, add, change, remove, saveProduct, deleteProduct],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('Store provider is missing');
  return context;
};

export const useCart = useStore;
