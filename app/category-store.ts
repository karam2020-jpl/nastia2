import type {DatabaseSync} from 'node:sqlite';
import {AccountError,transaction} from './admin-accounts.ts';
export function ensureCategories(db:DatabaseSync,defaults:string[]){
 db.exec('CREATE TABLE IF NOT EXISTS categories(name TEXT PRIMARY KEY COLLATE NOCASE)');
 transaction(db,()=>{if(db.prepare("SELECT value FROM app_meta WHERE key='categories_version'").get())return;
 const insert=db.prepare('INSERT OR IGNORE INTO categories(name) VALUES(?)');for(const name of defaults)insert.run(name);
 for(const row of db.prepare("SELECT DISTINCT category FROM products WHERE trim(category)<>''").all())insert.run(String(row.category));
 db.prepare("INSERT INTO app_meta VALUES('categories_version','1')").run();});
}
export const listCategories=(db:DatabaseSync)=>db.prepare('SELECT name FROM categories ORDER BY rowid').all().map(r=>String(r.name));
function nameOf(value:unknown){if(typeof value!=='string'||!value.trim()||value.trim().length>100)throw new AccountError('اسم القسم مطلوب وبحد أقصى 100 حرف.');return value.trim();}
// These mutations run in the caller's transaction, with the admin audit entry.
export function addCategory(db:DatabaseSync,value:unknown){const name=nameOf(value);if(db.prepare('SELECT name FROM categories WHERE name=?').get(name))throw new AccountError('هذا القسم موجود بالفعل.',409);db.prepare('INSERT INTO categories(name) VALUES(?)').run(name);}
export function renameCategory(db:DatabaseSync,oldValue:unknown,value:unknown){const old=nameOf(oldValue),name=nameOf(value);if(!db.prepare('SELECT name FROM categories WHERE name=?').get(old))throw new AccountError('القسم غير موجود.',404);if(old!==name&&db.prepare('SELECT name FROM categories WHERE name=?').get(name))throw new AccountError('هذا القسم موجود بالفعل.',409);db.prepare('UPDATE categories SET name=? WHERE name=?').run(name,old);db.prepare('UPDATE products SET category=? WHERE category=?').run(name,old);}
export function removeCategory(db:DatabaseSync,value:unknown){const name=nameOf(value);if(db.prepare('SELECT id FROM products WHERE category=? LIMIT 1').get(name))throw new AccountError('انقل منتجات هذا القسم إلى قسم آخر قبل حذفه.',409);db.prepare('DELETE FROM categories WHERE name=?').run(name);}
