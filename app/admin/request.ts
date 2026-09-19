'use client';
export async function adminRequest(url:string,options?:RequestInit){
  const response=await fetch(url,{cache:'no-store',...options});
  const data=await response.json();
  if(response.status===401){window.location.assign('/admin/login');throw new Error('انتهت الجلسة.');}
  if(!response.ok)throw new Error(data.error||'تعذر إكمال العملية.');return data;
}
