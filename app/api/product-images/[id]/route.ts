import {db} from '../../../lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404});
  const row=db.prepare('SELECT bytes,mime FROM product_images WHERE id=?').get(id);if(!row)return new Response(null,{status:404});
  return new Response(new Uint8Array(row.bytes as Uint8Array),{headers:{'Content-Type':String(row.mime),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
