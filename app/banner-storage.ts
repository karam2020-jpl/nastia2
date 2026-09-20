import type {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {defaultBanner, type BannerSettings} from './banner-settings.ts';
export type BannerImage = {bytes: Uint8Array; mime: string};
export type BannerSlot = 'desktop' | 'mobile';
export function ensureBannerTable(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS homepage_banner (
    id INTEGER PRIMARY KEY CHECK(id=1), settings TEXT NOT NULL,
    desktop BLOB, desktop_mime TEXT, mobile BLOB, mobile_mime TEXT, version TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS homepage_extra_banners (id INTEGER PRIMARY KEY CHECK(id IN (2,3)), settings TEXT NOT NULL, desktop BLOB,desktop_mime TEXT,mobile BLOB,mobile_mime TEXT,version TEXT NOT NULL)`);
}
export function readBanner(db: DatabaseSync, slide=1): BannerSettings {
  const row = db.prepare(`SELECT settings, desktop IS NOT NULL AS has_desktop, mobile IS NOT NULL AS has_mobile, version FROM ${slide===1?'homepage_banner':'homepage_extra_banners'} WHERE id=?`).get(slide);
  if (!row) return {...defaultBanner};
  const data = JSON.parse(String(row.settings));
  return {...defaultBanner, ...data,
    desktopImage: row.has_desktop ? `/api/banner/image/desktop?v=${row.version}&slide=${slide}` : '',
    mobileImage: row.has_mobile ? `/api/banner/image/mobile?v=${row.version}&slide=${slide}` : '',
  };
}
export function saveBanner(db: DatabaseSync, settings: BannerSettings, images: Record<BannerSlot, BannerImage | null | undefined>, onSaved?: () => void, slide=1) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const old = db.prepare(`SELECT * FROM ${slide===1?'homepage_banner':'homepage_extra_banners'} WHERE id=?`).get(slide);
    const image = (slot: BannerSlot) => images[slot] === undefined
      ? {bytes: old?.[slot] ?? null, mime: old?.[`${slot}_mime`] ?? null}
      : {bytes: images[slot]?.bytes ?? null, mime: images[slot]?.mime ?? null};
    const desktop = image('desktop'), mobile = image('mobile');
    const {desktopImage: _d, mobileImage: _m, ...text} = settings;
    db.prepare(`INSERT INTO ${slide===1?'homepage_banner':'homepage_extra_banners'} VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      settings=excluded.settings, desktop=excluded.desktop, desktop_mime=excluded.desktop_mime,
      mobile=excluded.mobile, mobile_mime=excluded.mobile_mime, version=excluded.version`)
      .run(slide, JSON.stringify(text), desktop.bytes, desktop.mime, mobile.bytes, mobile.mime, randomUUID());
    onSaved?.();
    db.exec('COMMIT');
    return readBanner(db,slide);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function readBannerImage(db: DatabaseSync, slot: BannerSlot, slide=1): BannerImage | null {
  const row = db.prepare(`SELECT ${slot} AS bytes, ${slot}_mime AS mime FROM ${slide===1?'homepage_banner':'homepage_extra_banners'} WHERE id=?`).get(slide);
  return row?.bytes ? {bytes: row.bytes as Uint8Array, mime: String(row.mime)} : null;
}

export function readBannerSlides(db:DatabaseSync){return [readBanner(db),...[2,3].filter(id=>db.prepare('SELECT id FROM homepage_extra_banners WHERE id=?').get(id)).map(id=>readBanner(db,id))];}
