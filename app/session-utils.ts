import {createHmac,timingSafeEqual} from 'node:crypto';
export const sessionSignature=(issued:string,secret:string)=>createHmac('sha256',secret).update(issued).digest('hex');
export const makeSessionToken=(issued:string,secret:string)=>`${issued}.${sessionSignature(issued,secret)}`;
export function verifySessionToken(token:string|undefined,secret:string,now=Date.now()){if(!token||secret.length<32)return false;const [issued,provided]=token.split('.');if(!issued||!provided||!/^\d+$/.test(issued)||now-Number(issued)>8*60*60*1000||Number(issued)>now+60_000)return false;const expected=sessionSignature(issued,secret);return provided.length===expected.length&&timingSafeEqual(Buffer.from(provided),Buffer.from(expected))}
