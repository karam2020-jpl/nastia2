import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {audited} from '../../../lib/auth';
import {adminRoute,jsonBody} from '../../../lib/admin-api';
import {AccountError} from '../../../admin-accounts';
const statuses=['جديد','مؤكد','قيد التجهيز','شُحن','مكتمل','ملغي','مرتجع'];
export const GET=adminRoute('orders',()=>{const orders=db.prepare('SELECT * FROM orders ORDER BY id DESC').all();const lines=db.prepare('SELECT * FROM order_items WHERE order_id=?');return NextResponse.json(orders.map(o=>({...o,lines:lines.all(o.id as number)})));});
export const PATCH=adminRoute('orders',async(request,user)=>{
  const {id,status}=await jsonBody(request);
  if(!Number.isSafeInteger(id)||typeof status!=='string'||!statuses.includes(status))throw new AccountError('قيمة غير صالحة.');
  audited(user,'orders','تغيير حالة الطلب',String(id),()=>{
    const old=db.prepare('SELECT status FROM orders WHERE id=?').get(Number(id));if(!old)throw new AccountError('الطلب غير موجود.',404);
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status,Number(id));
  },status);
  return NextResponse.json({ok:true});
});
