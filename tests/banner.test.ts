import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defaultBanner, MAX_IMAGE_BYTES, validateBanner, validateBannerImage} from '../app/banner-settings.ts';
import {ensureBannerTable, readBanner, readBannerImage, saveBanner} from '../app/banner-storage.ts';
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBz0AAAAASUVORK5CYII=', 'base64'));
test('banner validates text limits and rejects external or obfuscated links', () => {
  assert.equal(validateBanner({...defaultBanner,buttonHref:'/products?category=makeup'}).buttonHref,'/products?category=makeup');
  for (const href of ['https://evil.test','//evil.test','javascript:alert(1)','/\\evil.test','/%2fevil.test','/%255cevil.test','/\n/evil.test','/%00evil','/%ZZ'])
    assert.throws(() => validateBanner({...defaultBanner,buttonHref:href}));
  assert.throws(() => validateBanner({...defaultBanner,title:' '}));
  assert.throws(() => validateBanner({...defaultBanner,title:'a'.repeat(121)}));
  assert.throws(() => validateBanner({...defaultBanner,imageAlt:null}));
});
test('banner uploads check signatures, MIME, empty and oversized files', () => {
  assert.equal(validateBannerImage(png,'image/png'),'image/png');
  assert.throws(() => validateBannerImage(png,'image/jpeg'));
  assert.throws(() => validateBannerImage(new Uint8Array(),'image/png'));
  assert.throws(() => validateBannerImage(new Uint8Array(MAX_IMAGE_BYTES+1),'image/png'));
  assert.throws(() => validateBannerImage(Buffer.from('<svg onload="alert(1)"></svg>'),'image/png'));
});
test('banner text and both images persist across restart, preserve and remove independently', () => {
  const dir = mkdtempSync(join(tmpdir(),'nastia-banner-')); const path = join(dir,'test.sqlite');
  let db = new DatabaseSync(path);
  try {
    ensureBannerTable(db); assert.deepEqual(readBanner(db),defaultBanner);
    const saved = saveBanner(db,{...defaultBanner,title:'عرض جديد'},{desktop:{bytes:png,mime:'image/png'},mobile:{bytes:png,mime:'image/png'}});
    assert.match(saved.desktopImage,/^\/api\/banner\/image\/desktop\?v=/);
    db.close(); db = new DatabaseSync(path); ensureBannerTable(db);
    assert.equal(readBanner(db).title,'عرض جديد');
    assert.deepEqual(readBannerImage(db,'mobile')?.bytes,png);
    saveBanner(db,{...defaultBanner,title:'تعديل النص فقط'},{desktop:undefined,mobile:undefined});
    assert.deepEqual(readBannerImage(db,'desktop')?.bytes,png);
    saveBanner(db,defaultBanner,{desktop:null,mobile:undefined});
    assert.equal(readBanner(db).desktopImage,''); assert.ok(readBanner(db).mobileImage);
    saveBanner(db,defaultBanner,{desktop:undefined,mobile:null});
    assert.equal(readBanner(db).mobileImage,'');
  } finally { db.close(); rmSync(dir,{recursive:true,force:true}); }
});
