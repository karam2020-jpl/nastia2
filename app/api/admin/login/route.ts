import {NextResponse} from 'next/server';
import {login} from '../../../lib/auth';
import {jsonBody,sameOrigin,apiError} from '../../../lib/admin-api';
import {AccountError} from '../../../admin-accounts';
export async function POST(request:Request){try{
  if(!sameOrigin(request))throw new AccountError('مصدر الطلب غير مسموح.',403);
  const data=await jsonBody(request);
  if(typeof data.username!=='string'||typeof data.password!=='string')throw new AccountError('أدخل اسم المستخدم وكلمة المرور.');
  const user=await login(data.username,data.password);return NextResponse.json({ok:true,user},{headers:{'Cache-Control':'no-store'}});
}catch(error){return apiError(error);}}
