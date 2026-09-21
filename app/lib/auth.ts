import 'server-only';
import {cookies} from 'next/headers';
import {db} from './db';
import {ensureAccounts, bootstrapOwner, authenticate, sessionUser, tokenHash, audit, AccountError, transaction} from '../admin-accounts';
import {can, type AdminUser, type Permission} from '../admin-permissions';
ensureAccounts(db);
const cookieName='nastia_admin';
let boot:Promise<void>|undefined;
async function ready(){
  if(!boot)boot=bootstrapOwner(db,process.env.ADMIN_USERNAME,process.env.ADMIN_PASSWORD).catch(e=>{boot=undefined;throw e;});
  await boot;
}
export async function getAdminUser(){await ready();return sessionUser(db,(await cookies()).get(cookieName)?.value);}
export async function login(username:string,password:string){
  await ready();const result=await authenticate(db,username,password);
  (await cookies()).set(cookieName,result.token,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:8*60*60,path:'/'});
  return result.user;
}
export async function destroySession(){
  const jar=await cookies();const token=jar.get(cookieName)?.value;
  const user=sessionUser(db,token);
  if(token)transaction(db,()=>{db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(tokenHash(token));if(user)audit(db,user,'تسجيل الخروج',String(user.id));});
  jar.delete(cookieName);
}
export function assertAccess(user:AdminUser,permission:Permission){
  const current=db.prepare('SELECT role,active FROM admin_users WHERE id=?').get(user.id);
  if(!current?.active||!can(current.role as AdminUser['role'],permission))throw new AccountError('ليست لديك صلاحية لهذه العملية.',403);
}
export function audited<T>(user:AdminUser,permission:Permission,action:string,target:string,work:()=>T,details=''){
  return transaction(db,()=>{assertAccess(user,permission);const result=work();audit(db,user,action,target,details);return result;});
}
