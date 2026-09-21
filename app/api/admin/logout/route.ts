import {NextResponse} from 'next/server';
import {destroySession} from '../../../lib/auth';
import {sameOrigin,apiError} from '../../../lib/admin-api';
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'مصدر الطلب غير مسموح.'},{status:403});try{await destroySession();return NextResponse.json({ok:true});}catch(error){return apiError(error);}}
