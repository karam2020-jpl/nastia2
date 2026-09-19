import {NextResponse} from 'next/server';
import {isAdmin} from '../../../lib/auth';
import {db, readBanner, saveBanner} from '../../../lib/banner';
import {BannerInputError, MAX_BANNER_BODY, validateBanner, validateBannerImage} from '../../../banner-settings';
import type {BannerImage, BannerSlot} from '../../../banner-storage';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({error:'غير مصرح'},{status:401});
  return NextResponse.json(readBanner(db), {headers:{'Cache-Control':'no-store'}});
}
async function limitedForm(request: Request) {
  if (Number(request.headers.get('content-length')) > MAX_BANNER_BODY)
    throw new BannerInputError('حجم الرفع أكبر من المسموح.');
  const reader = request.body?.getReader();
  if (!reader) throw new BannerInputError('بيانات الحفظ مفقودة.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.length;
      if (size > MAX_BANNER_BODY) { await reader.cancel(); throw new BannerInputError('حجم الرفع أكبر من المسموح.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return await new Response(Buffer.concat(chunks), {headers:{'Content-Type':request.headers.get('content-type') || ''}}).formData(); }
  catch { throw new BannerInputError('صيغة بيانات الحفظ غير صالحة.'); }
}
export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({error:'غير مصرح'},{status:401});
  let sameOrigin = false;
  try {
    const origin = new URL(request.headers.get('origin') || '');
    sameOrigin = ['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { /* Missing or malformed origins are rejected. */ }
  if (!sameOrigin)
    return NextResponse.json({error:'مصدر الطلب غير مسموح.'},{status:403});
  try {
    const form = await limitedForm(request);
    const settings = validateBanner(Object.fromEntries(form));
    const images = {} as Record<BannerSlot, BannerImage | null | undefined>;
    for (const slot of ['desktop','mobile'] as const) {
      const file = form.get(`${slot}File`);
      if (file instanceof File && file.size > 0) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        images[slot] = {bytes, mime:validateBannerImage(bytes, file.type)};
      } else if (form.get(`remove_${slot}`) === 'true') images[slot] = null;
    }
    return NextResponse.json(saveBanner(db, settings, images), {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    if (error instanceof BannerInputError) return NextResponse.json({error:error.message},{status:400});
    console.error('Banner save failed', error);
    return NextResponse.json({error:'تعذر حفظ البانر. حاول مرة أخرى.'},{status:500});
  }
}
