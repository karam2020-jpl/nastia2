import 'server-only';
import {db} from './db';
import {ensureBannerTable} from '../banner-storage';
ensureBannerTable(db);
export {db};
export {readBanner, saveBanner, readBannerImage} from '../banner-storage';
