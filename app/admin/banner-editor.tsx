'use client';
import {useEffect, useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import BannerView from '../banner-view';
import {defaultBanner, MAX_IMAGE_BYTES, validateBanner, type BannerSettings} from '../banner-settings';
type Slot = 'desktop' | 'mobile';
export default function BannerEditor(){const [slide,setSlide]=useState(1);return <><div className="title-row"><h2>بانرات الواجهة</h2><select aria-label="اختيار البانر" value={slide} onChange={e=>{if(window.confirm('الانتقال إلى بانر آخر؟ التعديلات غير المحفوظة ستُفقد.'))setSlide(Number(e.target.value));}}>{[1,2,3].map(n=><option value={n} key={n}>البانر {n}</option>)}</select></div><p>احفظ البانر الثاني والثالث لإضافتهما إلى العرض المتحرك. الأول يبقى محفوظاً.</p><SlideEditor key={slide} slide={slide}/></>}
function SlideEditor({slide}:{slide:number}) {
  const router = useRouter();
  const [settings, setSettings] = useState<BannerSettings>(defaultBanner);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0), [inputKey, setInputKey] = useState(0);
  const [files, setFiles] = useState<Partial<Record<Slot, File>>>({});
  const [removed, setRemoved] = useState<Partial<Record<Slot, boolean>>>({});
  const [urls, setUrls] = useState<Partial<Record<Slot, string>>>({});
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/admin/banner?slide=${slide}`, {cache:'no-store', signal:controller.signal}).then(async response => {
      if (response.status === 401) { router.replace('/admin/login'); throw new Error('انتهت الجلسة. سجّل الدخول مجدداً.'); }
      if (!response.ok) throw new Error('تعذر تحميل إعدادات البانر.');
      const data = await response.json(); if (active) { setSettings(data); setLoading(false); }
    }).catch(e => { if (active) setError(e.message || 'تعذر الاتصال.'); });
    return () => { active = false; controller.abort(); };
  }, [attempt, router, slide]);
  useEffect(() => {
    const next: Partial<Record<Slot,string>> = {};
    for (const slot of ['desktop','mobile'] as const) if (files[slot]) next[slot] = URL.createObjectURL(files[slot]);
    setUrls(next);
    return () => { Object.values(next).forEach(url => URL.revokeObjectURL(url)); };
  }, [files]);
  const preview = {...settings,
    desktopImage: urls.desktop || (removed.desktop ? '' : settings.desktopImage),
    mobileImage: urls.mobile || (removed.mobile ? '' : settings.mobileImage),
  };
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    try { validateBanner(settings); } catch(e) { setError((e as Error).message); return; }
    setBusy(true);
    try {
      const form = new FormData();
      for (const key of ['title','subtitle','buttonText','buttonHref','imageAlt'] as const) form.set(key, settings[key]);
      for (const slot of ['desktop','mobile'] as const) {
        if (files[slot]) form.set(`${slot}File`, files[slot]);
        if (removed[slot]) form.set(`remove_${slot}`, 'true');
      }
      const response = await fetch(`/api/admin/banner?slide=${slide}`, {method:'POST', body:form});
      if (response.status === 401) { router.replace('/admin/login'); throw new Error('انتهت الجلسة. سجّل الدخول مجدداً.'); }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر الحفظ.');
      setSettings(data); setFiles({}); setRemoved({}); setInputKey(n => n + 1);
      setMessage('تم حفظ البانر. يظهر التعديل عند فتح الصفحة الرئيسية أو تحديثها.');
      router.refresh();
    } catch(e) { setError((e as Error).message || 'تعذر الاتصال. حاول مجدداً.'); }
    finally { setBusy(false); }
  }
  if (loading) return <section className="panel">{error ? <><p role="alert">{error}</p><button className="btn" onClick={() => setAttempt(n => n + 1)}>إعادة المحاولة</button></> : <p role="status">جارٍ تحميل الإعدادات…</p>}</section>;
  return <section className="panel banner-editor">
    <p>عدّل النص والصور ثم اضغط حفظ. لن تُنشر المعاينة قبل الحفظ.</p>
    <form onSubmit={save}>
      <fieldset disabled={busy} className="formgrid banner-fields">
<h3 className="wide">رفع صور البانر</h3>
        {(['desktop','mobile'] as const).map(slot => <div className="field upload-box" key={slot}>
          <label className="btn upload-label" htmlFor={`banner-${slot}`}>رفع {slot === 'desktop' ? 'صورة الحاسوب — 1920 × 800' : 'صورة الهاتف — 1080 × 1350'}</label>
          <input id={`banner-${slot}`} key={`${slot}-${inputKey}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
            const file = e.target.files?.[0]; if (!file) return;
            if (file.size > MAX_IMAGE_BYTES || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
              setError('اختر صورة JPG أو PNG أو WebP بحجم لا يتجاوز 4 ميغابايت.'); e.target.value = ''; return;
            }
            setError(''); setMessage(''); setFiles(prev => ({...prev,[slot]:file})); setRemoved(prev => ({...prev,[slot]:false}));
          }}/>
          <small>حتى 4 ميغابايت. يفضّل أقل من 500 كيلوبايت.</small>
          {preview[slot === 'desktop' ? 'desktopImage' : 'mobileImage'] && <>
            <img className="banner-thumbnail" src={preview[slot === 'desktop' ? 'desktopImage' : 'mobileImage']} alt={`معاينة صورة ${slot === 'desktop' ? 'الحاسوب' : 'الهاتف'}`}/>
            <button type="button" className="choice danger" onClick={() => {
              setFiles(prev => ({...prev,[slot]:undefined})); setRemoved(prev => ({...prev,[slot]:true})); setInputKey(n => n + 1); setMessage('');
            }}>إزالة الصورة عند الحفظ</button>
          </>}
        </div>)}
        <label className="field wide">العنوان<textarea required maxLength={120} value={settings.title} onChange={e => setSettings({...settings,title:e.target.value})}/></label>
        <label className="field wide">النص الوصفي<textarea maxLength={300} value={settings.subtitle} onChange={e => setSettings({...settings,subtitle:e.target.value})}/></label>
        <label className="field">نص الزر<input required maxLength={40} value={settings.buttonText} onChange={e => setSettings({...settings,buttonText:e.target.value})}/></label>
        <label className="field">رابط الزر داخل الموقع<input required dir="ltr" maxLength={500} value={settings.buttonHref} onChange={e => setSettings({...settings,buttonHref:e.target.value})}/><small>مثال: /products</small></label>
        <label className="field wide">وصف الصورة لقارئات الشاشة<input required maxLength={180} value={settings.imageAlt} onChange={e => setSettings({...settings,imageAlt:e.target.value})}/></label>
        <p className="muted wide">عند عدم رفع صورة للهاتف تُستخدم صورة الحاسوب. إزالة الصورتين تعيد الرسم الافتراضي. اترك مساحة للنص يمين صورة الحاسوب وأسفل صورة الهاتف.</p>
        <button className="btn wide" type="submit">{busy ? 'جارٍ الحفظ…' : 'حفظ إعدادات الصفحة الرئيسية'}</button>
      </fieldset>
      {error && <p role="alert" className="notice">{error}</p>}
      {message && <p role="status" className="added-message">{message}</p>}
    </form>
    {slide!==1&&<button type="button" disabled={busy} className="choice danger" onClick={async()=>{if(!window.confirm('إزالة هذا البانر من العرض؟'))return;setBusy(true);try{const response=await fetch(`/api/admin/banner?slide=${slide}`,{method:'DELETE'});if(!response.ok)throw new Error('تعذر حذف البانر.');setFiles({});setRemoved({});setAttempt(n=>n+1);setMessage('تمت إزالة البانر من العرض.');router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>إزالة هذا البانر من العرض</button>}<h2>معاينة البانر</h2><BannerView settings={preview} preview/>
    <a className="choice" href="/" target="_blank" rel="noopener noreferrer">فتح الصفحة الرئيسية بعد الحفظ</a>
  </section>;
}
