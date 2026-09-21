import {NextResponse} from 'next/server';
import {db} from '../../lib/support';
import {apiError,jsonBody,sameOrigin} from '../../lib/admin-api';
import {AccountError,transaction} from '../../admin-accounts';
import {createTicket,customerTicket,reply,limitSupport} from '../../support-store';
export async function POST(request:Request){try{
 if(!sameOrigin(request))throw new AccountError('مصدر الطلب غير مسموح.',403);
 const input=await jsonBody(request);let result:unknown;
 if(input.action==='create')result=createTicket(db,input);
 else if(input.action==='lookup'||input.action==='reply'){
  const current=customerTicket(db,input.id,input.code);
  if(input.action==='reply'){limitSupport(db,'reply:'+String(input.id),30);transaction(db,()=>reply(db,String(input.id),'العميل',input.body));result=customerTicket(db,input.id,input.code);}else result=current;
 }else throw new AccountError('العملية غير صالحة.');
 return NextResponse.json(result,{status:input.action==='create'?201:200,headers:{'Cache-Control':'no-store'}});
}catch(e){return apiError(e);}}
