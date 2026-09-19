import 'server-only';
import {NextResponse} from 'next/server';
import {getAdminUser} from './auth';
import {AccountError} from '../admin-accounts';
import {can,type AdminUser,type Permission} from '../admin-permissions';
export function sameOrigin(request:Request){
  try { const origin=new URL(request.headers.get('origin')||'');return ['http:','https:'].includes(origin.protocol)&&origin.host===request.headers.get('host'); }catch{return false;}
}
export function apiError(error:unknown){
  if(error instanceof AccountError)return NextResponse.json({error:error.message},{status:error.status});
  if(error instanceof SyntaxError)return NextResponse.json({error:'بيانات غير صالحة.'},{status:400});
  console.error('Admin request failed',error);return NextResponse.json({error:'تعذر إكمال العملية. حاول مجدداً.'},{status:500});
}
export function adminRoute(permission:Permission|null,handler:(request:Request,user:AdminUser)=>Promise<Response>|Response){
  return async(request:Request)=>{try{
    const user=await getAdminUser();if(!user)throw new AccountError('انتهت الجلسة. سجّل الدخول مجدداً.',401);
    if(permission&&!can(user.role,permission))throw new AccountError('ليست لديك صلاحية لهذا القسم.',403);
    if(request.method!=='GET'&&!sameOrigin(request))throw new AccountError('مصدر الطلب غير مسموح.',403);
    const response=await handler(request,user);response.headers.set('Cache-Control','no-store');return response;
  }catch(error){return apiError(error);}};
}
export async function boundedBody(request:Request,limit:number){
  if(Number(request.headers.get('content-length'))>limit)throw new AccountError('حجم البيانات أكبر من المسموح.',413);
  const reader=request.body?.getReader();if(!reader)throw new AccountError('بيانات الطلب مفقودة.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new AccountError('حجم البيانات أكبر من المسموح.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  return Buffer.concat(chunks);
}
export async function jsonBody(request:Request){
  const data=JSON.parse((await boundedBody(request,64*1024)).toString('utf8'));
  if(!data||typeof data!=='object'||Array.isArray(data))throw new AccountError('بيانات غير صالحة.');return data as Record<string,unknown>;
}
