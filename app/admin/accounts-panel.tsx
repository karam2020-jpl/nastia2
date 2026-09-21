'use client';
import {useEffect,useState,type FormEvent} from 'react';
import {roleLabels,type AdminUser,type AdminRole} from '../admin-permissions';
import {adminRequest} from './request';
const blank=()=>({id:0,username:'',name:'',role:'orders' as AdminRole,active:true,password:''});
export default function AccountsPanel({currentId}:{currentId:number}){
  const [users,setUsers]=useState<AdminUser[]>([]),[draft,setDraft]=useState<ReturnType<typeof blank>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const load=async()=>setUsers(await adminRequest('/api/admin/users'));
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  async function save(event:FormEvent){event.preventDefault();if(!draft)return;setBusy(true);setError('');setMessage('');try{
    await adminRequest('/api/admin/users',{method:draft.id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
    if(draft.id===currentId){window.location.assign('/admin/login');return;}
    setDraft(null);await load();setMessage('تم حفظ الحساب. أُلغيت جلساته السابقة عند التعديل.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <section className="panel"><div className="title-row"><h2>حسابات الفريق</h2><button className="btn" onClick={()=>{setDraft(blank());setError('');}}>إضافة حساب</button></div>
    <p>لكل موظف حساب مستقل. المالك وحده يدير الحسابات ورسوم التوصيل وسجل التعديلات.</p>
    {error&&<p className="notice" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
    <table><thead><tr><th>الاسم</th><th>اسم الدخول</th><th>الدور</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.username}</td><td>{roleLabels[u.role]}</td><td>{u.active?'نشط':'معطل'}</td><td><button className="choice" onClick={()=>{setDraft({...u,password:''});setError('');}}>تعديل / تعطيل</button></td></tr>)}</tbody></table>
    {draft&&<div className="modal-backdrop"><form className="modal" onSubmit={save}><h2>{draft.id?'تعديل الحساب':'حساب جديد'}</h2><fieldset disabled={busy} className="formgrid banner-fields">
      <label className="field">الاسم<input required maxLength={80} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label className="field">اسم الدخول<input dir="ltr" required disabled={Boolean(draft.id)} minLength={3} maxLength={64} pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,63}" value={draft.username} onChange={e=>setDraft({...draft,username:e.target.value})}/></label>
      <label className="field">الدور<select value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as AdminRole})}>{Object.entries(roleLabels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
      <label className="field">{draft.id?'كلمة مرور جديدة (اتركها فارغة لإبقائها)':'كلمة المرور'}<input type="password" autoComplete="new-password" required={!draft.id} minLength={12} maxLength={128} value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})}/></label>
      <label className="wide"><input type="checkbox" checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/> الحساب نشط</label>
      <p className="muted wide">تغيير الدور أو كلمة المرور أو تعطيل الحساب يلغي جلساته. لا يمكن تعطيل آخر مالك. تعديل حسابك يتطلب تسجيل الدخول مجدداً.</p>
      {error&&<p role="alert" className="notice wide">{error}</p>}
      <button className="btn" type="submit">{busy?'جارٍ الحفظ…':'حفظ الحساب'}</button><button className="choice" type="button" onClick={()=>setDraft(null)}>إلغاء</button>
    </fieldset></form></div>}
  </section>;
}
