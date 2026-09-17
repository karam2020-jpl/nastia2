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
  add: (product: Product, shade?: string, size?: string, quantity?: number) => void;
  change: (lineKey: string, quantity: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  setDeliveryFee: (province: string, fee: number) => void;
};

const StoreContext = createContext<Store | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<{items: CartItem[]; message: string; noticeId: number}>({items: [], message: '', noticeId: 0});
  const {items} = cart;
  const setItems = useCallback((update: CartItem[] | ((current: CartItem[]) => CartItem[])) => {
    setCart((current) => ({...current, items: typeof update === 'function' ? update(current.items) : update}));
  }, []);
  useEffect(() => {
    if (!cart.message) return;
    const timer = setTimeout(() => setCart((current) => ({...current, message: ''})), 4000);
    return () => clearTimeout(timer);
  }, [cart.noticeId, cart.message]);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [deliveryFees, setDeliveryFees] = useState(initialDelivery);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    setItems(reconcileCart(readCartStorage(window.localStorage),initialProducts));
    setCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;
    writeCartStorage(window.localStorage,items);
  }, [items, cartLoaded]);

  const add = useCallback((product: Product, shade = product.shades[0], size = product.sizes[0], quantity = 1) => {
    setCart((current) => {
      const liveProduct = products.find((item) => item.id === product.id);
      const used = current.items.reduce((sum, item) => sum + (item.product.id === product.id ? item.qty : 0), 0);
      if (!liveProduct || !liveProduct.shades.includes(shade) || !liveProduct.sizes.includes(size) || !Number.isInteger(quantity) || quantity < 1) {
        return {...current, message: 'تعذرت الإضافة. يرجى التحقق من خيارات المنتج.', noticeId: current.noticeId + 1};
      }
      if (used + quantity > liveProduct.stock) {
        return {...current, message: 'الكمية المطلوبة تتجاوز المخزون المتاح.', noticeId: current.noticeId + 1};
      }
      let next = current.items;
      for (let i = 0; i < quantity; i++) next = addCartLine(next, liveProduct, shade, size);
      return {items: next, message: 'تمت إضافة المنتج إلى السلة', noticeId: current.noticeId + 1};
    });
  }, [products]);

  const change = useCallback((lineKey: string, quantity: number) => {
    setItems((current) => changeCartLine(current,lineKey,quantity));
  }, []);

  const remove = useCallback((lineKey: string) => {
    setItems((current) => removeCartLine(current,lineKey));
  }, []);

  const saveProduct = useCallback((product: Product) => {
    const clean = sanitizeProduct(product);
    const exists = products.some((item) => item.id === clean.id);
    const nextProducts = exists ? products.map((item) => (item.id === clean.id ? clean : item)) : [clean, ...products];
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

  return <StoreContext.Provider value={value}>{children}<div className="cart-notification" role="status" aria-live="polite" aria-atomic="true">{cart.message && <div key={cart.noticeId} className="cart-notification-body"><span>{cart.message}</span><button type="button" aria-label="إغلاق الإشعار" onClick={() => setCart((current) => ({...current, message: ''}))}>×</button></div>}</div></StoreContext.Provider>;
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('Store provider is missing');
  return context;
};

export const useCart = useStore;
