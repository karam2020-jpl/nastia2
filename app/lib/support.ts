import 'server-only';
import {db} from './db';
import {ensureSupport} from '../support-store';
ensureSupport(db);
export {db};
