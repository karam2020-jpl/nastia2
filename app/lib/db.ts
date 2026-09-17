import 'server-only';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {initialDelivery,initialProducts,Product} from '../data';
import {sqliteSchema} from '../sqlite-schema';

const path=resolve(process.env.DATABASE_PATH||'./data/nastia.sqlite');
mkdirSync(dirname(path),{recursive:true});
const db=new DatabaseSync(path);
db.exec(sqliteSchema);
const count=(db.prepare('SELECT COUNT(*) count FROM products').get() as {count:number}).count;
if(!count){const insert=db.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?)');for(const p of initialProducts)insert.run(p.id,p.name,p.brand,p.category,p.price,p.description,JSON.stringify(p.shades),JSON.stringify(p.sizes),p.stock,p.color)}
const feeCount=(db.prepare('SELECT COUNT(*) count FROM delivery_fees').get() as {count:number}).count;
if(!feeCount){const insert=db.prepare('INSERT INTO delivery_fees VALUES(?,?)');for(const [province,fee] of Object.entries(initialDelivery))insert.run(province,fee)}

const productFromRow=(row:Record<string,unknown>):Product=>({...row,price:Number(row.price),stock:Number(row.stock),shades:JSON.parse(String(row.shades)),sizes:JSON.parse(String(row.sizes))}) as Product;
export const getProducts=()=>db.prepare('SELECT * FROM products ORDER BY rowid').all().map((r)=>productFromRow(r as Record<string,unknown>));
export const getProduct=(id:string)=>{const row=db.prepare('SELECT * FROM products WHERE id=?').get(id);return row?productFromRow(row as Record<string,unknown>):undefined};
export const saveProduct=(p:Product)=>db.prepare(`INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,brand=excluded.brand,category=excluded.category,price=excluded.price,description=excluded.description,shades=excluded.shades,sizes=excluded.sizes,stock=excluded.stock,color=excluded.color`).run(p.id,p.name,p.brand,p.category,p.price,p.description,JSON.stringify(p.shades),JSON.stringify(p.sizes),p.stock,p.color);
export const deleteProduct=(id:string)=>db.prepare('DELETE FROM products WHERE id=?').run(id);
export const getFees=()=>Object.fromEntries(db.prepare('SELECT province,fee FROM delivery_fees').all().map((r)=>[String((r as {province:string}).province),Number((r as {fee:number}).fee)]));
export const setFee=(province:string,fee:number)=>db.prepare('INSERT INTO delivery_fees VALUES(?,?) ON CONFLICT(province) DO UPDATE SET fee=excluded.fee').run(province,fee);
export {db};
