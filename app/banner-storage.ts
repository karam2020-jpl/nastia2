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
}
export function readBanner(db: DatabaseSync): BannerSettings {
  const row = db.prepare('SELECT settings, desktop IS NOT NULL AS has_desktop, mobile IS NOT NULL AS has_mobile, version FROM homepage_banner WHERE id=1').get();
  if (!row) return {...defaultBanner};
  const data = JSON.parse(String(row.settings));
  return {...defaultBanner, ...data,
    desktopImage: row.has_desktop ? `/api/banner/image/desktop?v=${row.version}` : '',
    mobileImage: row.has_mobile ? `/api/banner/image/mobile?v=${row.version}` : '',
  };
}
export function saveBanner(db: DatabaseSync, settings: BannerSettings, images: Record<BannerSlot, BannerImage | null | undefined>, onSaved?: () => void) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const old = db.prepare('SELECT * FROM homepage_banner WHERE id=1').get();
    const image = (slot: BannerSlot) => images[slot] === undefined
      ? {bytes: old?.[slot] ?? null, mime: old?.[`${slot}_mime`] ?? null}
      : {bytes: images[slot]?.bytes ?? null, mime: images[slot]?.mime ?? null};
    const desktop = image('desktop'), mobile = image('mobile');
    const {desktopImage: _d, mobileImage: _m, ...text} = settings;
    db.prepare(`INSERT INTO homepage_banner VALUES(1,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      settings=excluded.settings, desktop=excluded.desktop, desktop_mime=excluded.desktop_mime,
      mobile=excluded.mobile, mobile_mime=excluded.mobile_mime, version=excluded.version`)
      .run(JSON.stringify(text), desktop.bytes, desktop.mime, mobile.bytes, mobile.mime, randomUUID());
    onSaved?.();
    db.exec('COMMIT');
    return readBanner(db);
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function readBannerImage(db: DatabaseSync, slot: BannerSlot): BannerImage | null {
  const row = db.prepare(`SELECT ${slot} AS bytes, ${slot}_mime AS mime FROM homepage_banner WHERE id=1`).get();
  return row?.bytes ? {bytes: row.bytes as Uint8Array, mime: String(row.mime)} : null;
}
