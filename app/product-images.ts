import type {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {AccountError} from './admin-accounts.ts';
export type ProductImage={id:string;url:string};
export type ImageChange={id:string}|{bytes:Uint8Array;mime:string};
export function ensureProductImages(db:DatabaseSync){db.exec(`CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL);
  CREATE INDEX IF NOT EXISTS product_images_product ON product_images(product_id,position);`);}
export function getProductImages(db:DatabaseSync,id:string):ProductImage[]{
  return db.prepare('SELECT id FROM product_images WHERE product_id=? ORDER BY position').all(id).map(row=>({id:String(row.id),url:`/api/product-images/${row.id}`}));
}
// Caller owns the transaction so product fields, images and audit commit together.
export function replaceProductImages(db:DatabaseSync,productId:string,images:ImageChange[]){
  if(images.length>4)throw new AccountError('يمكن رفع أربع صور فقط لكل منتج.');
  const ids=new Set<string>();
  for(const image of images)if('id' in image){
    if(ids.has(image.id)||!db.prepare('SELECT id FROM product_images WHERE id=? AND product_id=?').get(image.id,productId))throw new AccountError('صورة غير صالحة لهذا المنتج.');
    ids.add(image.id);
  }
  const previous=db.prepare('SELECT id FROM product_images WHERE product_id=?').all(productId);
  for(const row of previous)if(!ids.has(String(row.id)))db.prepare('DELETE FROM product_images WHERE id=?').run(row.id as string);
  images.forEach((image,position)=>{
    if('id' in image)db.prepare('UPDATE product_images SET position=? WHERE id=? AND product_id=?').run(position,image.id,productId);
    else db.prepare('INSERT INTO product_images VALUES(?,?,?,?,?)').run(randomUUID(),productId,position,image.mime,image.bytes);
  });
}
