import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {adminRoute} from '../../../lib/admin-api';
export const GET=adminRoute('audit',()=>NextResponse.json(db.prepare('SELECT id,actor_name,action,target,details,created_at FROM admin_audit ORDER BY id DESC LIMIT 200').all()));
