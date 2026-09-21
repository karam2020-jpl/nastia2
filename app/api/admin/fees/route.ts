import {NextResponse} from 'next/server';
import {getFees,setFee} from '../../../lib/db';
import {audited} from '../../../lib/auth';
import {adminRoute,jsonBody} from '../../../lib/admin-api';
import {AccountError} from '../../../admin-accounts';
import {provinces} from '../../../data';
export const GET=adminRoute('delivery',()=>NextResponse.json(getFees()));
export const POST=adminRoute('delivery',async(request,user)=>{
  const {province,fee}=await jsonBody(request);
  if(typeof province!=='string'||!provinces.includes(province)||!Number.isSafeInteger(fee)||Number(fee)<0)throw new AccountError('قيمة غير صالحة.');
  audited(user,'delivery','تغيير رسوم التوصيل',province,()=>setFee(province,Number(fee)),String(fee));return NextResponse.json({ok:true});
});
