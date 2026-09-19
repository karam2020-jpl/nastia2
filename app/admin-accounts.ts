import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {isRole, type AdminRole, type AdminUser} from './admin-permissions.ts';
export class AccountError extends Error { status:number; constructor(message:string, status=400){super(message);this.status=status;} }
export function ensureAccounts(db:DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','orders','products','content')),
    active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id), expires_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS admin_sessions_user ON admin_sessions(user_id);
  CREATE TABLE IF NOT EXISTS admin_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, actor_name TEXT NOT NULL,
    action TEXT NOT NULL, target TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS admin_login_limits (username TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL);`);
}
const derive = (password:string,salt:string) => new Promise<Buffer>((resolve,reject)=>{
  scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key));
});
export async function hashPassword(password:string) {
  const salt=randomBytes(16).toString('hex');return `scrypt$${salt}$${(await derive(password,salt)).toString('hex')}`;
}
export async function verifyPassword(password:string, stored:string) {
  const [algorithm,salt,hex]=stored.split('$');
  if(algorithm!=='scrypt'||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hex))return false;
  return timingSafeEqual(await derive(password,salt),Buffer.from(hex,'hex'));
}
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
const publicUser=(row:Record<string,unknown>):AdminUser=>({id:Number(row.id),username:String(row.username),name:String(row.name),role:row.role as AdminRole,active:Boolean(row.active)});
export function listAccounts(db:DatabaseSync) {return db.prepare('SELECT id,username,name,role,active FROM admin_users ORDER BY id').all().map(publicUser);}
export function audit(db:DatabaseSync,actor:AdminUser|null,action:string,target:string,details='') {
  db.prepare('INSERT INTO admin_audit(actor_id,actor_name,action,target,details) VALUES(?,?,?,?,?)').run(actor?.id??null,actor?.username??'system',action,target,details);
}
export function transaction<T>(db:DatabaseSync, action:()=>T):T {
  db.exec('BEGIN IMMEDIATE');try{const result=action();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}
}
// Initial environment credentials bootstrap exactly once; they cannot override later account changes.
export async function bootstrapOwner(db:DatabaseSync,username?:string,password?:string) {
  if(db.prepare('SELECT id FROM admin_users LIMIT 1').get())return;
  if(!username?.trim()||!password||password.startsWith('replace-with-')||password.length>128||username.trim().length>64)return;
  const hash=await hashPassword(password);
  transaction(db,()=>{
    if(db.prepare('SELECT id FROM admin_users LIMIT 1').get())return;
    const result=db.prepare("INSERT INTO admin_users(username,name,password_hash,role) VALUES(?,?,?,'owner')").run(username.trim().toLowerCase(),'مالك المتجر',hash);
    audit(db,null,'إنشاء المالك الأول',String(result.lastInsertRowid));
  });
}
export function sessionUser(db:DatabaseSync,token:string|undefined,now=Date.now()):AdminUser|null {
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=db.prepare('SELECT u.* FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1').get(tokenHash(token),now);
  return row?publicUser(row):null;
}
export async function authenticate(db:DatabaseSync,username:string,password:string) {
  const key=username.trim().toLowerCase(); const now=Date.now();
  if(key.length>64||password.length>128)throw new AccountError('بيانات الدخول غير صحيحة.',401);
  // Reserve an attempt before asynchronous hashing so parallel requests also count.
  transaction(db,()=>{
    db.prepare('DELETE FROM admin_login_limits WHERE expires_at<=?').run(now);
    const limit=db.prepare('SELECT attempts FROM admin_login_limits WHERE username=?').get(key);
    if(limit&&Number(limit.attempts)>=5)throw new AccountError('محاولات كثيرة. أعد المحاولة بعد 15 دقيقة.',429);
    db.prepare('INSERT INTO admin_login_limits VALUES(?,1,?) ON CONFLICT(username) DO UPDATE SET attempts=attempts+1').run(key,now+15*60*1000);
  });
  const row=db.prepare('SELECT * FROM admin_users WHERE username=? COLLATE NOCASE').get(key);
  const valid=await verifyPassword(password,row?String(row.password_hash):`scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`);
  if(!row||!row.active||!valid)throw new AccountError('بيانات الدخول غير صحيحة.',401);
  return transaction(db,()=>{
    const live=db.prepare('SELECT * FROM admin_users WHERE id=? AND active=1 AND password_hash=?').get(row.id as number,row.password_hash as string);
    if(!live)throw new AccountError('بيانات الدخول غير صحيحة.',401);
    const token=randomBytes(32).toString('hex');
    db.prepare('DELETE FROM admin_sessions WHERE expires_at<=?').run(now);
    db.prepare('INSERT INTO admin_sessions VALUES(?,?,?)').run(tokenHash(token),live.id as number,now+8*60*60*1000);
    db.prepare('DELETE FROM admin_login_limits WHERE username=?').run(key);
    audit(db,publicUser(live),'تسجيل الدخول',String(live.id));
    return {token,user:publicUser(live)};
  });
}
function fields(input:Record<string,unknown>) {
  const name=typeof input.name==='string'?input.name.trim():'';
  if(!name||name.length>80||!isRole(input.role)||typeof input.active!=='boolean')throw new AccountError('الاسم والدور وحالة الحساب مطلوبة.');
  return {name,role:input.role,active:input.active};
}
export function checkPassword(password:unknown):asserts password is string {
  if(typeof password!=='string'||password.length<12||password.length>128)throw new AccountError('كلمة المرور يجب أن تكون بين 12 و128 محرفاً.');
}
function requireOwner(db:DatabaseSync,actor:AdminUser) {
  const row=db.prepare("SELECT id FROM admin_users WHERE id=? AND role='owner' AND active=1").get(actor.id);
  if(!row)throw new AccountError('هذه العملية متاحة للمالك فقط.',403);
}
export async function createAccount(db:DatabaseSync,actor:AdminUser,input:Record<string,unknown>) {
  const data=fields(input); const username=typeof input.username==='string'?input.username.trim().toLowerCase():'';
  if(!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username))throw new AccountError('اسم المستخدم: 3–64 حرفاً إنجليزياً أو رقماً أو . أو _ أو -');
  checkPassword(input.password);const hash=await hashPassword(input.password);
  return transaction(db,()=>{
    requireOwner(db,actor);
    if(db.prepare('SELECT id FROM admin_users WHERE username=?').get(username))throw new AccountError('اسم المستخدم مستخدم بالفعل.',409);
    const result=db.prepare('INSERT INTO admin_users(username,name,password_hash,role,active) VALUES(?,?,?,?,?)').run(username,data.name,hash,data.role,Number(data.active));
    audit(db,actor,'إنشاء حساب',username,data.role);
    return Number(result.lastInsertRowid);
  });
}
export async function updateAccount(db:DatabaseSync,actor:AdminUser,id:number,input:Record<string,unknown>) {
  const data=fields(input);
  let hash:string|undefined;
  if(input.password!==undefined&&input.password!==''){checkPassword(input.password);hash=await hashPassword(input.password);}
  transaction(db,()=>{
    requireOwner(db,actor);
    const old=db.prepare('SELECT * FROM admin_users WHERE id=?').get(id);
    if(!old)throw new AccountError('الحساب غير موجود.',404);
    if(old.role==='owner'&&old.active&&(!data.active||data.role!=='owner')) {
      const count=db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='owner' AND active=1").get();
      if(Number(count?.n)<=1)throw new AccountError('لا يمكن تعطيل آخر مالك أو تغيير دوره.');
    }
    db.prepare('UPDATE admin_users SET name=?,role=?,active=?,password_hash=? WHERE id=?').run(data.name,data.role,Number(data.active),hash??String(old.password_hash),id);
    // Revoke on every edit, including owner-initiated password resets.
    db.prepare('DELETE FROM admin_sessions WHERE user_id=?').run(id);
    audit(db,actor,'تعديل حساب',String(old.username),JSON.stringify({role:data.role,active:data.active,passwordReset:Boolean(hash)}));
  });
}
