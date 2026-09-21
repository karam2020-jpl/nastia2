export type BannerSettings = {
  title: string; subtitle: string; buttonText: string; buttonHref: string; imageAlt: string;
  desktopImage: string; mobileImage: string;
};
export const defaultBanner: BannerSettings = {
  title: 'عنايتك تبدأ\nمن هنا', subtitle: 'منتجات فاخرة مختارة لتكملي روتين جمالك.',
  buttonText: 'تسوّقي الآن ←', buttonHref: '/products', imageAlt: 'Nastia Beauty',
  desktopImage: '', mobileImage: '',
};
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_BANNER_BODY = 2 * MAX_IMAGE_BYTES + 64 * 1024;
export class BannerInputError extends Error {}
export function validateBanner(input: Record<string, unknown>): BannerSettings {
  const limits = {title: 120, subtitle: 300, buttonText: 40, buttonHref: 500, imageAlt: 180};
  const result = {...defaultBanner};
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    const value = input[key];
    if (typeof value !== 'string' || value.trim().length > limits[key])
      throw new BannerInputError('النص غير صالح أو يتجاوز الطول المسموح.');
    result[key] = value.trim();
  }
  if (!result.title || !result.buttonText || !result.imageAlt)
    throw new BannerInputError('العنوان ونص الزر ووصف الصورة مطلوبة.');
  // Only same-site paths, never external URLs, backslashes, or encoded controls.
  let decoded: string;
  try { decoded = decodeURIComponent(result.buttonHref); }
  catch { throw new BannerInputError('رابط الزر غير صالح.'); }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\s\u0000-\u001f\u007f%]/.test(decoded))
    throw new BannerInputError('استخدم رابطاً داخل الموقع يبدأ بـ / مثل /products.');
  return result;
}
export function validateBannerImage(bytes: Uint8Array, declaredType: string): string {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES)
    throw new BannerInputError('حجم كل صورة يجب ألا يتجاوز 4 ميغابايت.');
  const head = Array.from(bytes.slice(0, 12));
  const ascii = (start: number, end: number) => String.fromCharCode(...head.slice(start, end));
  let mime = '';
  if (bytes.length > 24 && head.slice(0,8).join(',') === '137,80,78,71,13,10,26,10') {
    if (String.fromCharCode(...bytes.slice(12,16)) === 'IHDR') mime = 'image/png';
  }
  if (bytes.length > 12 && head[0] === 255 && head[1] === 216 && head[2] === 255) mime = 'image/jpeg';
  if (bytes.length > 20 && ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP') mime = 'image/webp';
  if (!mime || mime !== declaredType)
    throw new BannerInputError('الصورة يجب أن تكون JPG أو PNG أو WebP صحيحة. ملفات SVG غير مسموحة.');
  return mime;
}
