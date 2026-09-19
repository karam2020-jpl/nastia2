import {NextResponse} from 'next/server';
import {db,getCategories} from '../../../lib/db';
import {adminRoute,jsonBody} from '../../../lib/admin-api';
import {audited} from '../../../lib/auth';
import {addCategory,renameCategory,removeCategory} from '../../../category-store';
export const GET=adminRoute('categories',()=>NextResponse.json(getCategories()));
export const POST=adminRoute('categories',async(request,user)=>{const input=await jsonBody(request);audited(user,'categories','إضافة قسم',String(input.name),()=>addCategory(db,input.name));return NextResponse.json(getCategories(),{status:201});});
export const PATCH=adminRoute('categories',async(request,user)=>{const input=await jsonBody(request);audited(user,'categories','تعديل قسم',String(input.oldName),()=>renameCategory(db,input.oldName,input.name));return NextResponse.json(getCategories());});
export const DELETE=adminRoute('categories',async(request,user)=>{const input=await jsonBody(request);audited(user,'categories','حذف قسم',String(input.name),()=>removeCategory(db,input.name));return NextResponse.json(getCategories());});
