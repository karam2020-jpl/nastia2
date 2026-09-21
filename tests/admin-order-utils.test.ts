import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesOrder,orderDate} from '../app/admin-order-utils.ts';
import {DatabaseSync} from 'node:sqlite';
import {ensureCategories,categoryDetails,saveCategoryImage,renameCategory} from '../app/category-store.ts';
test('customer search supports Arabic names, Arabic digits and local/international phone formats',()=>{
 const order={id:23,customer_name:'أحمد محمد',phone:'+964 770 123 4567'};
 for(const q of ['احمد','محمد','٠٧٧٠١٢٣٤٥٦٧','+9647701234567','#٢٣',''])assert.ok(matchesOrder(order,q),q);
 assert.equal(matchesOrder(order,'حسين'),false);
});
test('SQLite UTC dates display in Baghdad, including next-day rollover',()=>{
 assert.equal(orderDate('2026-09-21 22:30:00'),new Intl.DateTimeFormat('ar-IQ',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date('2026-09-22T01:30:00+03:00')));
 assert.equal(orderDate('invalid'),'غير متوفر');
});
test('removing an icon preserves category/products and remembers removal after reinitialization and rename',()=>{
 const db=new DatabaseSync(':memory:');db.exec("PRAGMA foreign_keys=ON;CREATE TABLE app_meta(key TEXT PRIMARY KEY,value TEXT);CREATE TABLE products(id TEXT,category TEXT);INSERT INTO products VALUES('p','المكياج')");
 ensureCategories(db,['المكياج']);saveCategoryImage(db,'المكياج',{bytes:new Uint8Array([1]),mime:'image/png'});
 assert.ok(categoryDetails(db)[0].image);saveCategoryImage(db,'المكياج',null);ensureCategories(db,['المكياج']);renameCategory(db,'المكياج','مكياج');
 assert.deepEqual(categoryDetails(db),[{name:'مكياج',customized:true,image:''}]);assert.equal(db.prepare('SELECT category FROM products').get()?.category,'مكياج');db.close();
});
