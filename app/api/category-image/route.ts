import {db} from '../../lib/db';
export const dynamic='force-dynamic';
export async function GET(request:Request){const name=new URL(request.url).searchParams.get('name');if(!name||name.length>100)return new Response(null,{status:404});const row=db.prepare('SELECT bytes,mime FROM category_images WHERE name=?').get(name);if(!row)return new Response(null,{status:404});return new Response(new Uint8Array(row.bytes as Uint8Array),{headers:{'Content-Type':String(row.mime),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
