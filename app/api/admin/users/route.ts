import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {adminRoute,jsonBody} from '../../../lib/admin-api';
import {listAccounts,createAccount,updateAccount,AccountError} from '../../../admin-accounts';
export const GET=adminRoute('users',()=>NextResponse.json(listAccounts(db)));
export const POST=adminRoute('users',async(request,user)=>{const id=await createAccount(db,user,await jsonBody(request));return NextResponse.json({id},{status:201});});
export const PATCH=adminRoute('users',async(request,user)=>{const input=await jsonBody(request);if(!Number.isSafeInteger(input.id)||Number(input.id)<=0)throw new AccountError('معرّف غير صالح.');await updateAccount(db,user,Number(input.id),input);return NextResponse.json({ok:true});});
