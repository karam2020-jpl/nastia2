import {NextResponse} from 'next/server';
import {db,getCategories} from '../../../lib/db';
import {adminRoute,jsonBody,boundedBody} from '../../../lib/admin-api';
import {audited} from '../../../lib/auth';
import {AccountError} from '../../../admin-accounts';
import {BannerInputError,MAX_IMAGE_BYTES,validateBannerImage} from '../../../banner-settings';
import {addCategory,renameCategory,removeCategory,categoryDetails,saveCategoryImage} from '../../../category-store';
export const GET=adminRoute('categories',(request)=>NextResponse.json(new URL(request.url).searchParams.has('details')?categoryDetails(db):getCategories()));
async function inputOf(request:Request){
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return {input:await jsonBody(request),image:undefined};
 const bytes=await boundedBody(request,MAX_IMAGE_BYTES+16384);let form:FormData;
 try{form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();}catch{throw new AccountError('بيانات الرفع غير صالحة.');}
 const input={name:form.get('name'),oldName:form.get('oldName')};let image:{bytes:Uint8Array;mime:string}|null|undefined;
 const file=form.get('image');if(file instanceof File&&file.size){const bytes=new Uint8Array(await file.arrayBuffer());try{image={bytes,mime:validateBannerImage(bytes,file.type)};}catch(e){if(e instanceof BannerInputError)throw new AccountError(e.message);throw e;}}else if(form.get('removeImage')==='true')image=null;
 return {input,image};
}
export const POST=adminRoute('categories',async(request,user)=>{const {input,image}=await inputOf(request);audited(user,'categories','إضافة قسم',String(input.name),()=>{addCategory(db,input.name);saveCategoryImage(db,String(input.name).trim(),image);});return NextResponse.json(getCategories(),{status:201});});
export const PATCH=adminRoute('categories',async(request,user)=>{const {input,image}=await inputOf(request);audited(user,'categories','تعديل قسم',String(input.oldName),()=>{renameCategory(db,input.oldName,input.name);saveCategoryImage(db,String(input.name).trim(),image);});return NextResponse.json(getCategories());});
export const DELETE=adminRoute('categories',async(request,user)=>{const input=await jsonBody(request);audited(user,'categories','حذف قسم',String(input.name),()=>removeCategory(db,input.name));return NextResponse.json(getCategories());});
