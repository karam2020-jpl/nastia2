import type { Product } from './data';

export type CartItem = { product: Product; qty: number; shade: string; size: string };
export const cartLineKey = (productId: string, shade: string, size: string) => `${productId}::${shade}::${size}`;

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return typeof p.id === 'string' && typeof p.name === 'string' && typeof p.brand === 'string' && typeof p.category === 'string' && typeof p.description === 'string' && typeof p.color === 'string' && typeof p.price === 'number' && p.price >= 0 && Number.isFinite(p.price) && typeof p.stock === 'number' && p.stock >= 0 && Number.isInteger(p.stock) && Array.isArray(p.shades) && p.shades.every((x) => typeof x === 'string') && Array.isArray(p.sizes) && p.sizes.every((x) => typeof x === 'string');
};

export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is CartItem => {
      if (!value || typeof value !== 'object') return false;
      const item = value as Record<string, unknown>;
      return isProduct(item.product) && typeof item.qty === 'number' && Number.isInteger(item.qty) && item.qty > 0 && item.qty <= item.product.stock && typeof item.shade === 'string' && item.product.shades.includes(item.shade) && typeof item.size === 'string' && item.product.sizes.includes(item.size);
    });
  } catch { return []; }
}

type CartStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const readCartStorage = (storage: CartStorage): CartItem[] => {
  try { return parseStoredCart(storage.getItem('nastia-cart')); } catch { return []; }
};
export const writeCartStorage = (storage: CartStorage, items: CartItem[]): boolean => {
  try { storage.setItem('nastia-cart',JSON.stringify(items)); return true; } catch { return false; }
};

export const changeCartLine = (items: CartItem[], lineKey: string, quantity: number) => items.map((item) => cartLineKey(item.product.id,item.shade,item.size) === lineKey ? {...item,qty:Math.max(1,Math.min(Math.trunc(quantity),item.product.stock))} : item);
export const removeCartLine = (items: CartItem[], lineKey: string) => items.filter((item) => cartLineKey(item.product.id,item.shade,item.size) !== lineKey);
export const sanitizeProduct = (product: Product): Product => ({...product,price:Math.max(0,product.price),stock:Math.max(0,Math.trunc(product.stock))});
export const updateDeliveryFee = (fees: Record<string,number>, province: string, fee: number) => ({...fees,[province]:Math.max(0,fee)});
export const cleanProductOptions = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

/** Refresh cart snapshots from the live catalogue and discard lines that can no longer be ordered. */
export const reconcileCart = (items: CartItem[], products: Product[]): CartItem[] => items.flatMap((item) => {
  const product = products.find((candidate) => candidate.id === item.product.id);
  if (!product || product.stock < 1 || !product.shades.includes(item.shade) || !product.sizes.includes(item.size)) return [];
  return [{...item,product,qty:Math.min(item.qty,product.stock)}];
});
