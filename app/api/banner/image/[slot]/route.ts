import {db, readBannerImage} from '../../../../lib/banner';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: {params: Promise<{slot: string}>}) {
  const {slot} = await context.params;
  if (slot !== 'desktop' && slot !== 'mobile') return new Response(null,{status:404});
  const slide=Number(new URL(_request.url).searchParams.get('slide')||1);
  if(![1,2,3].includes(slide))return new Response(null,{status:404});
  const image = readBannerImage(db,slot,slide);
  if (!image) return new Response(null,{status:404});
  return new Response(new Uint8Array(image.bytes), {headers:{
    'Content-Type':image.mime, 'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; sandbox",
  }});
}
