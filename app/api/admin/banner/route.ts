import {NextResponse} from 'next/server';
import {assertAccess} from '../../../lib/auth';
import {adminRoute,apiError} from '../../../lib/admin-api';
import {audit,AccountError} from '../../../admin-accounts';
import {db, readBanner, saveBanner} from '../../../lib/banner';
import {BannerInputError, MAX_BANNER_BODY, validateBanner, validateBannerImage} from '../../../banner-settings';
import type {BannerImage, BannerSlot} from '../../../banner-storage';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = adminRoute('content', async () => {
  return NextResponse.json(readBanner(db), {headers:{'Cache-Control':'no-store'}});
});
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
export const POST = adminRoute('content', async (request, user) => {
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
    return NextResponse.json(saveBanner(db, settings, images, () => { assertAccess(user,'content'); audit(db,user,'تعديل البانر','homepage'); }), {headers:{'Cache-Control':'no-store'}});
  } catch (error) {
    if (error instanceof AccountError) return apiError(error);
    if (error instanceof BannerInputError) return NextResponse.json({error:error.message},{status:400});
    console.error('Banner save failed', error);
    return NextResponse.json({error:'تعذر حفظ البانر. حاول مرة أخرى.'},{status:500});
  }
});
