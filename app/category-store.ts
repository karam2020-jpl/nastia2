import {randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {AccountError,transaction} from './admin-accounts.ts';
export function ensureCategories(db:DatabaseSync,defaults:string[]){
 db.exec('CREATE TABLE IF NOT EXISTS categories(name TEXT PRIMARY KEY COLLATE NOCASE)');
 db.exec('CREATE TABLE IF NOT EXISTS category_images(name TEXT PRIMARY KEY COLLATE NOCASE REFERENCES categories(name) ON UPDATE CASCADE ON DELETE CASCADE,bytes BLOB NOT NULL,mime TEXT NOT NULL,version TEXT NOT NULL)');
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

export function categoryDetails(db:DatabaseSync){return db.prepare('SELECT c.name,i.version FROM categories c LEFT JOIN category_images i ON c.name=i.name ORDER BY c.rowid').all().map(r=>({name:String(r.name),image:r.version?`/api/category-image?name=${encodeURIComponent(String(r.name))}&v=${r.version}`:''}));}
export function saveCategoryImage(db:DatabaseSync,name:string,image:{bytes:Uint8Array;mime:string}|null|undefined){if(image===undefined)return;if(image===null){db.prepare('DELETE FROM category_images WHERE name=?').run(name);return;}db.prepare('INSERT INTO category_images VALUES(?,?,?,?) ON CONFLICT(name) DO UPDATE SET bytes=excluded.bytes,mime=excluded.mime,version=excluded.version').run(name,image.bytes,image.mime,randomUUID());}
