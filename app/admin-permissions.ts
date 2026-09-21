export const roleLabels = {owner:'المالك', orders:'مسؤول الطلبات', products:'مسؤول المنتجات', content:'مسؤول المحتوى', support:'مسؤول الدعم والشكاوى'} as const;
export type AdminRole = keyof typeof roleLabels;
export type Permission = 'orders' | 'products' | 'content' | 'delivery' | 'users' | 'audit' | 'support' | 'categories';
export type AdminUser = {id:number; username:string; name:string; role:AdminRole; active:boolean};
export function isRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && Object.hasOwn(roleLabels,value);
}
export function can(role: AdminRole, permission: Permission) {
  return role === 'owner' || role === permission;
}
