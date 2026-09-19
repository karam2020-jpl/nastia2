'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {type Product} from '../data';
import {MAX_IMAGE_BYTES} from '../banner-settings';
import {useStore} from '../providers';
import {adminRequest} from './request';
type ImageItem={id?:string;url?:string;file?:File;key:string};
export default function ProductEditor({product,onClose,onSaved}:{product:Product;onClose:()=>void;onSaved:()=>Promise<void>}){
  const {categories}=useStore();
  const [draft,setDraft]=useState({...product,category:product.category||categories[0]||''}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [images,setImages]=useState<ImageItem[]>((product.images||[]).map(i=>({...i,key:i.id})));
  const [previews,setPreviews]=useState<Record<string,string>>({});
  useEffect(()=>{const result:Record<string,string>={};const temporary:string[]=[];images.forEach(i=>{if(i.file){const url=URL.createObjectURL(i.file);result[i.key]=url;temporary.push(url);}else result[i.key]=i.url!;});setPreviews(result);return()=>temporary.forEach(url=>URL.revokeObjectURL(url));},[images]);
  async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError('');try{
    const form=new FormData();form.set('product',JSON.stringify(draft));
    form.set('images',JSON.stringify(images.map((image,index)=>{if(image.file){const key=`image-${index}`;form.set(key,image.file);return {upload:key};}return {id:image.id};})));
    await adminRequest('/api/admin/products',{method:'POST',body:form});await onSaved();onClose();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="title-row"><h2>بيانات المنتج</h2><button className="choice" type="button" disabled={busy} onClick={onClose}>إغلاق</button></div>
    <fieldset className="banner-fields formgrid" disabled={busy}>
      {(['name','brand'] as const).map(key=><label className="field" key={key}>{key==='name'?'الاسم':'الماركة'}<input required maxLength={key==='name'?200:100} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
      <label className="field">الفئة<select required value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option value="" disabled>اختر القسم</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="field">السعر<input type="number" min="0" step="1" required value={draft.price} onChange={e=>setDraft({...draft,price:Number(e.target.value)})}/></label>
      <label className="field">الدرجات — افصل بفاصلة<input required value={draft.shades.join('،')} onChange={e=>setDraft({...draft,shades:e.target.value.split(/[،,]/)})}/></label>
      <label className="field">الأحجام — افصل بفاصلة<input required value={draft.sizes.join('،')} onChange={e=>setDraft({...draft,sizes:e.target.value.split(/[،,]/)})}/></label>
      <label className="field">المخزون<input type="number" min="0" step="1" required value={draft.stock} onChange={e=>setDraft({...draft,stock:Number(e.target.value)})}/></label>
      <label className="field wide">الوصف<textarea required maxLength={5000} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
      <div className="wide"><h3>صور المنتج ({images.length}/4)</h3><p className="muted">اختر حتى 4 صور JPG أو PNG أو WebP، حتى 4 ميغابايت للصورة. الصورة الأولى هي الرئيسية.</p>
        <label className="field">إضافة صور<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={images.length>=4} onChange={e=>{
          const selected=Array.from(e.target.files||[]);e.target.value='';
          if(images.length+selected.length>4){setError('الحد الأقصى أربع صور. احذف صورة قبل إضافة غيرها.');return;}
          if(selected.some(f=>f.size>MAX_IMAGE_BYTES||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('اختر صوراً بصيغة مدعومة وحجم لا يتجاوز 4 ميغابايت للصورة.');return;}
          setError('');setImages(prev=>[...prev,...selected.map(file=>({file,key:crypto.randomUUID()}))]);
        }}/></label>
        <div className="editor-images">{images.map((image,index)=><div key={image.key}><img src={previews[image.key]} alt={`صورة المنتج ${index+1}`}/>{index===0?<b>الصورة الرئيسية</b>:<button type="button" className="choice" onClick={()=>setImages([image,...images.filter(i=>i.key!==image.key)])}>اجعلها الرئيسية</button>}<button type="button" className="choice danger" onClick={()=>setImages(images.filter(i=>i.key!==image.key))}>حذف الصورة</button></div>)}</div>
      </div>
      <button className="btn wide" type="submit">{busy?'جارٍ الحفظ…':'حفظ المنتج والصور'}</button>
    </fieldset>{error&&<p className="notice" role="alert">{error}</p>}
  </form></div>;
}
