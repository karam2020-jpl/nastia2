import 'server-only';
import {timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {makeSessionToken,verifySessionToken} from '../session-utils';

const cookieName='nastia_admin';
const secret=()=>process.env.ADMIN_SESSION_SECRET||'';
export function credentialsConfigured(){return Boolean(process.env.ADMIN_USERNAME&&process.env.ADMIN_PASSWORD&&secret().length>=32)}
export function validCredentials(username:string,password:string){if(!credentialsConfigured())return false;const a=Buffer.from(`${username}\0${password}`);const b=Buffer.from(`${process.env.ADMIN_USERNAME}\0${process.env.ADMIN_PASSWORD}`);return a.length===b.length&&timingSafeEqual(a,b)}
export async function createSession(){const issued=Date.now().toString();(await cookies()).set(cookieName,makeSessionToken(issued,secret()),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',maxAge:60*60*8,path:'/'})}
export async function destroySession(){(await cookies()).delete(cookieName)}
export async function isAdmin(){if(!credentialsConfigured())return false;return verifySessionToken((await cookies()).get(cookieName)?.value,secret())}
