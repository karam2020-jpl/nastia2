import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureProductImages,getProductImages,replaceProductImages} from '../app/product-images.ts';
import {transaction} from '../app/admin-accounts.ts';
test('four images reorder, reject cross-product references, rollback, remove and cascade on deletion',()=>{
  const db=new DatabaseSync(':memory:');db.exec("PRAGMA foreign_keys=ON; CREATE TABLE products(id TEXT PRIMARY KEY); INSERT INTO products VALUES('one'),('two');");ensureProductImages(db);
  try{
    const images=Array.from({length:4},(_,n)=>({bytes:new Uint8Array([n]),mime:'image/png'}));
    transaction(db,()=>replaceProductImages(db,'one',images));const saved=getProductImages(db,'one');assert.equal(saved.length,4);
    transaction(db,()=>replaceProductImages(db,'one',saved.slice().reverse().map(i=>({id:i.id}))));assert.equal(getProductImages(db,'one')[0].id,saved[3].id);
    assert.throws(()=>transaction(db,()=>replaceProductImages(db,'two',[{id:saved[0].id}])));assert.equal(getProductImages(db,'two').length,0);
    assert.throws(()=>transaction(db,()=>replaceProductImages(db,'one',[...images,images[0]])));assert.equal(getProductImages(db,'one').length,4);
    assert.throws(()=>transaction(db,()=>{replaceProductImages(db,'one',[]);throw new Error('rollback');}));assert.equal(getProductImages(db,'one').length,4);
    transaction(db,()=>replaceProductImages(db,'one',[{id:saved[2].id}]));assert.equal(getProductImages(db,'one').length,1);
    db.prepare('DELETE FROM products WHERE id=?').run('one');assert.equal(db.prepare('SELECT COUNT(*) AS n FROM product_images').get()?.n,0);
  }finally{db.close();}
});
