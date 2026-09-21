import {NextResponse} from 'next/server';import {getFees,getProducts,getCategories} from '../../lib/db';
export const runtime='nodejs';
export async function GET(){return NextResponse.json({products:getProducts(),categories:getCategories(),deliveryFees:getFees()})}

