export type CheckoutFields = {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  block: string;
  street: string;
  building: string;
  apartment: string;
  landmark: string;
  notes: string;
};

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

export const normalizeIraqiPhone = (value: string) => value
  .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
  .replace(/\s+/g, '');

export const isValidIraqiPhone = (value: string) => /^(?:07\d{9}|\+9647\d{9})$/.test(normalizeIraqiPhone(value));
export const shouldShowAddressFields = (province: string) => province.length > 0;
export const deliveryForProvince = (province: string, fees: Record<string, number>) => province ? fees[province] : undefined;

export function validateCheckout(fields: CheckoutFields): Partial<Record<keyof CheckoutFields,string>> {
  const errors: Partial<Record<keyof CheckoutFields,string>> = {};
  if (fields.fullName.trim().length < 3) errors.fullName = 'أدخلي الاسم الكامل.';
  if (!isValidIraqiPhone(fields.phone)) errors.phone = 'أدخلي رقماً عراقياً بصيغة 07xxxxxxxxx أو +9647xxxxxxxxx.';
  if (!fields.province) errors.province = 'اختاري المحافظة.';
  if (fields.province) {
    if (!fields.city.trim()) errors.city = 'المدينة أو القضاء مطلوب.';
    if (!fields.district.trim()) errors.district = 'المنطقة أو الحي مطلوب.';
    if (!fields.street.trim()) errors.street = 'الشارع أو الزقاق مطلوب.';
    if (!fields.landmark.trim()) errors.landmark = 'أقرب نقطة دالة مطلوبة.';
  }
  return errors;
}
