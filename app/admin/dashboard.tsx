'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {money,type Product,provinces} from '../data';
import {useStore} from '../providers';
import {can,roleLabels,type AdminUser,type Permission} from '../admin-permissions';
import {adminRequest} from './request';
import BannerEditor from './banner-editor';
import ProductEditor from './product-editor';
import CategoriesPanel from './categories-panel';
import SupportPanel from './support-panel';
import AccountsPanel from './accounts-panel';
type Order={id:number;customer_name:string;phone:string;province:string;city:string;district:string;block:string;street:string;building:string;apartment:string;landmark:string;notes:string;status:string;total:number;created_at:string;lines:{id:number;product_name:string;brand:string;shade:string;size:string;quantity:number;unit_price:number}[]};
type Audit={id:number;actor_name:string;action:string;target:string;details:string;created_at:string};
const statuses=['جديد','مؤكد','قيد التجهيز','شُحن','مكتمل','ملغي','مرتجع'];
const blank=():Product=>({id:`product-${crypto.randomUUID()}`,name:'',brand:'',category:'',price:0,description:'',shades:[''],sizes:[''],stock:0,color:'#eaf3ef',images:[]});
export default function AdminDashboard({user}:{user:AdminUser}){
  const router=useRouter();const {refreshCatalog}=useStore();
  const tabs:[string,string,Permission|null][]=[['overview','نظرة عامة',null],['products','المنتجات','products'],['orders','الطلبات','orders'],['delivery','التوصيل','delivery'],['banner','إعدادات الصفحة الرئيسية','content'],['categories','الأقسام','categories'],['support','الدعم والشكاوى','support'],['users','حسابات الفريق','users'],['audit','سجل التعديلات','audit']];
  const allowed=tabs.filter(([, ,permission])=>permission?can(user.role,permission):user.role==='owner');
  const [tab,setTab]=useState(allowed[0][0]),[products,setProducts]=useState<Product[]>([]),[orders,setOrders]=useState<Order[]>([]),[fees,setFees]=useState<Record<string,number>>({}),[audit,setAudit]=useState<Audit[]>([]);
  const [editing,setEditing]=useState<Product|null>(null),[selected,setSelected]=useState<Order|null>(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false);
  const load=async()=>{
    setLoading(true);try{
      if(tab==='overview'||tab==='products')setProducts(await adminRequest('/api/admin/products'));
      if(tab==='overview'||tab==='orders')setOrders(await adminRequest('/api/admin/orders'));
      if(tab==='delivery')setFees(await adminRequest('/api/admin/fees'));
      if(tab==='audit')setAudit(await adminRequest('/api/admin/audit'));
    }finally{setLoading(false);}
  };
  useEffect(()=>{setError('');setMessage('');void load().catch(e=>setError(e.message));},[tab]);
  async function mutate(action:()=>Promise<void>){setBusy(true);setError('');setMessage('');try{await action();await load();setMessage('تم حفظ التعديل.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  const logout=async()=>{try{await adminRequest('/api/admin/logout',{method:'POST'});router.replace('/admin/login');router.refresh();}catch(e){setError((e as Error).message);}};
  return <div className="admin"><aside className="sidebar"><div className="logo">Nastia Beauty</div><p>{user.name}<br/><small>{roleLabels[user.role]}</small></p><nav>{allowed.map(([key,label])=><button disabled={busy} className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{label}</button>)}<button onClick={logout}>تسجيل الخروج</button></nav></aside>
    <main className="adminmain"><div className="title-row"><h1>{tabs.find(t=>t[0]===tab)?.[1]}</h1>{tab==='products'&&<button className="btn" onClick={()=>setEditing(blank())}>+ إضافة منتج</button>}</div>
      {error&&<p className="notice" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}{loading&&<p role="status">جارٍ التحميل…</p>}
      {tab==='overview'&&<div className="stats"><div className="stat">الطلبات<b>{orders.length}</b></div><div className="stat">قيمة الطلبات غير الملغاة<b>{money(orders.filter(o=>o.status!=='ملغي').reduce((s,o)=>s+o.total,0))}</b></div><div className="stat">طلبات جديدة<b>{orders.filter(o=>o.status==='جديد').length}</b></div><div className="stat">مخزون منخفض<b>{products.filter(p=>p.stock<6).length}</b></div></div>}
      {tab==='categories'&&<CategoriesPanel/>}{tab==='support'&&<SupportPanel/>}{tab==='banner'&&<BannerEditor/>}{tab==='users'&&<AccountsPanel currentId={user.id}/>}
      {tab==='products'&&<section className="panel"><table><thead><tr><th>المنتج</th><th>الماركة</th><th>السعر</th><th>المخزون</th><th>إجراء</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.images?.[0]&&<img className="admin-product-thumb" src={p.images[0].url} alt=""/>}{p.name}</td><td>{p.brand}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><button className="choice" disabled={busy} onClick={()=>setEditing(p)}>تعديل</button> <button className="choice danger" disabled={busy} onClick={()=>{if(window.confirm(`حذف ${p.name}؟`))void mutate(async()=>{await adminRequest(`/api/admin/products?id=${encodeURIComponent(p.id)}`,{method:'DELETE'});await refreshCatalog();});}}>حذف</button></td></tr>)}</tbody></table></section>}
      {tab==='orders'&&<section className="panel"><table><thead><tr><th>الطلب</th><th>العميل</th><th>المحافظة</th><th>الإجمالي</th><th>الحالة</th><th/></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>#{o.id}</td><td>{o.customer_name}</td><td>{o.province}</td><td>{money(o.total)}</td><td><select disabled={busy} value={o.status} onChange={e=>{const status=e.target.value;void mutate(async()=>{await adminRequest('/api/admin/orders',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:o.id,status})});});}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td><button className="choice" onClick={()=>setSelected(o)}>التفاصيل</button></td></tr>)}</tbody></table></section>}
      {tab==='delivery'&&<section className="panel">{provinces.map(province=><div className="sumrow" key={province}><b>{province}</b><label className="field"><span className="muted">رسوم التوصيل</span><input aria-label={`رسوم ${province}`} min="0" step="1" type="number" placeholder="لم تُحدد الأجرة" value={fees[province]??''} onChange={e=>{const next={...fees};if(e.target.value==='')delete next[province];else next[province]=Number(e.target.value);setFees(next);}}/></label><button className="btn" disabled={busy||fees[province]===undefined} onClick={()=>void mutate(async()=>{await adminRequest('/api/admin/fees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({province,fee:fees[province]??0})});await refreshCatalog();})}>حفظ</button></div>)}</section>}
      {tab==='audit'&&<section className="panel"><p>آخر 200 عملية — الأوقات بتوقيت UTC.</p><button className="choice" onClick={()=>void load().catch(e=>setError(e.message))}>تحديث السجل</button><table><thead><tr><th>الوقت</th><th>الحساب</th><th>العملية</th><th>العنصر</th><th>التفاصيل</th></tr></thead><tbody>{audit.map(a=><tr key={a.id}><td>{a.created_at}</td><td>{a.actor_name}</td><td>{a.action}</td><td>{a.target}</td><td>{a.details}</td></tr>)}</tbody></table></section>}
      {editing&&<ProductEditor key={editing.id} product={editing} onClose={()=>setEditing(null)} onSaved={async()=>{await load();await refreshCatalog();setMessage('تم حفظ المنتج والصور.');}}/>}
      {selected&&<div className="modal-backdrop"><section className="modal"><div className="title-row"><h2>الطلب #{selected.id}</h2><button className="choice" onClick={()=>setSelected(null)}>إغلاق</button></div><p><b>{selected.customer_name}</b> — {selected.phone}</p><p><b>العنوان:</b> {[selected.province,selected.city,selected.district,selected.block,selected.street,selected.building,selected.apartment].filter(Boolean).join('، ')}</p><p><b>أقرب نقطة دالة:</b> {selected.landmark}</p><p><b>الملاحظات:</b> {selected.notes||'لا توجد ملاحظات'}</p>{selected.lines.map(line=><div className="sumrow" key={line.id}><span>{line.product_name} ({line.shade}، {line.size}) × {line.quantity}</span><b>{money(line.unit_price*line.quantity)}</b></div>)}</section></div>}
    </main></div>;
}
