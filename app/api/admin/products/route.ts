import {NextResponse} from 'next/server';
import {db,deleteProduct,getProducts,saveProduct,getProduct,getCategories} from '../../../lib/db';
import {audited} from '../../../lib/auth';
import {adminRoute,jsonBody,boundedBody} from '../../../lib/admin-api';
import {AccountError} from '../../../admin-accounts';
import {BannerInputError,MAX_IMAGE_BYTES,validateBannerImage} from '../../../banner-settings';
import {replaceProductImages,type ImageChange} from '../../../product-images';
import {cleanProductOptions} from '../../../store-utils';
import {type Product} from '../../../data';
function productInput(body:Record<string,unknown>):Product {
  const text=(key:string,max:number)=>{const value=body[key];if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new AccountError('أكمل بيانات المنتج ضمن الأطوال المسموحة.');return value.trim();};
  const options=(key:string)=>{const value=body[key];if(!Array.isArray(value)||value.length>50||value.some(x=>typeof x!=='string'||x.length>80))throw new AccountError('الدرجات والأحجام غير صالحة.');const result=cleanProductOptions(value);if(!result.length)throw new AccountError('أضف درجة وحجماً واحداً على الأقل.');return result;};
  const id=text('id',100);if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new AccountError('معرّف المنتج غير صالح.');
  if(!Number.isSafeInteger(body.price)||Number(body.price)<0||!Number.isSafeInteger(body.stock)||Number(body.stock)<0)throw new AccountError('السعر والمخزون يجب أن يكونا أعداداً صحيحة غير سالبة.');
  const category=text('category',100);if(!getCategories().includes(category))throw new AccountError('الفئة غير صالحة.');
  return {id,name:text('name',200),brand:text('brand',100),category,description:text('description',5000),price:Number(body.price),stock:Number(body.stock),shades:options('shades'),sizes:options('sizes'),color:typeof body.color==='string'&&/^#[a-fA-F0-9]{6}$/.test(body.color)?body.color:'#eaf3ef'};
}
export const GET=adminRoute('products',()=>NextResponse.json(getProducts()));
export const POST=adminRoute('products',async(request,user)=>{
  let body:Record<string,unknown>,images:ImageChange[]|undefined;
  if(request.headers.get('content-type')?.startsWith('multipart/form-data')){
    const buffer=await boundedBody(request,4*MAX_IMAGE_BYTES+128*1024);
    let form:FormData;
    try{form=await new Response(buffer,{headers:{'Content-Type':request.headers.get('content-type')!}}).formData();}catch{throw new AccountError('صيغة الرفع غير صالحة.');}
    body=JSON.parse(String(form.get('product')));const manifest=JSON.parse(String(form.get('images')));
    if(!body||typeof body!=='object'||Array.isArray(body)||!Array.isArray(manifest)||manifest.length>4)throw new AccountError('بيانات الصور غير صالحة.');
    images=[];const used=new Set<string>();
    for(const entry of manifest){
      if(!entry||typeof entry!=='object')throw new AccountError('بيانات الصور غير صالحة.');
      if(typeof entry.id==='string'){images.push({id:entry.id});continue;}
      if(typeof entry.upload!=='string'||used.has(entry.upload))throw new AccountError('بيانات الصور غير صالحة.');used.add(entry.upload);
      const file=form.get(entry.upload);if(!(file instanceof File))throw new AccountError('ملف الصورة مفقود.');
      const bytes=new Uint8Array(await file.arrayBuffer());
      try{images.push({bytes,mime:validateBannerImage(bytes,file.type)});}catch(e){if(e instanceof BannerInputError)throw new AccountError(e.message);throw e;}
    }
  }else body=await jsonBody(request);
  const product=productInput(body);
  audited(user,'products','حفظ منتج',product.id,()=>{
    if(!getCategories().includes(product.category))throw new AccountError('القسم لم يعد موجوداً. حدّث الصفحة واختر قسماً آخر.');
    saveProduct(product);if(images!==undefined)replaceProductImages(db,product.id,images);
  },JSON.stringify({name:product.name,price:product.price,stock:product.stock,images:images?.length}));
  return NextResponse.json(getProduct(product.id));
});
export const DELETE=adminRoute('products',async(request,user)=>{
  const id=new URL(request.url).searchParams.get('id');if(!id)throw new AccountError('المعرّف مطلوب.');
  audited(user,'products','حذف منتج',id,()=>deleteProduct(id));return NextResponse.json({ok:true});
});
