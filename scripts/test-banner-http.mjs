// Run after npm run build. Uses a temporary database and generated credentials only.
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const temp = mkdtempSync(join(tmpdir(),'nastia-banner-http-'));
const password = randomBytes(24).toString('hex');
const port = 3197, base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{
  env:{...process.env,DATABASE_PATH:join(temp,'banner.sqlite'),ADMIN_USERNAME:'banner-test',ADMIN_PASSWORD:password,ADMIN_SESSION_SECRET:randomBytes(32).toString('hex')},
  stdio:['ignore','pipe','pipe'],
});
let logs = ''; child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
try {
  let ready = false;
  for (let n=0;n<20;n++) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Server exited: '+logs);
    try { if ((await fetch(base+'/api/catalog',{signal:AbortSignal.timeout(2000)})).ok) { ready=true;break; } } catch {}
    await new Promise(r=>setTimeout(r,250));
  }
  assert.ok(ready,'Server did not start: '+logs);
  assert.equal((await fetch(base+'/api/admin/banner')).status,401);
  assert.equal((await fetch(base+'/api/admin/banner',{method:'POST'})).status,401);
  const login = await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'banner-test',password})});
  assert.equal(login.status,200);
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const headers = {Cookie:cookie,Origin:base};
  assert.equal((await fetch(base+'/api/admin/banner',{method:'POST',headers:{...headers,Origin:'https://other.test'}})).status,403);
  const initial = await (await fetch(base+'/api/admin/banner',{headers})).json();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBz0AAAAASUVORK5CYII=','base64');
  const form = () => { const f=new FormData(); for(const key of ['title','subtitle','buttonText','buttonHref','imageAlt'])f.set(key,initial[key]);return f; };
  let f=form();f.set('title','HTTP banner test');f.set('desktopFile',new Blob([png],{type:'image/png'}),'desktop.png');f.set('mobileFile',new Blob([png],{type:'image/png'}),'mobile.png');
  const saved = await fetch(base+'/api/admin/banner',{method:'POST',headers,body:f});assert.equal(saved.status,200);
  const data=await saved.json();assert.ok(data.desktopImage);assert.ok(data.mobileImage);
  const img=await fetch(base+data.desktopImage);assert.equal(img.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await img.arrayBuffer()),png);
  assert.match(await (await fetch(base)).text(),/HTTP banner test/);
  f=form();f.set('buttonHref','//evil.test');assert.equal((await fetch(base+'/api/admin/banner',{method:'POST',headers,body:f})).status,400);
  f=form();f.set('desktopFile',new Blob(['<svg/>'],{type:'image/png'}),'fake.png');assert.equal((await fetch(base+'/api/admin/banner',{method:'POST',headers,body:f})).status,400);
  assert.equal((await (await fetch(base+'/api/admin/banner',{headers})).json()).title,'HTTP banner test');
  f=form();f.set('remove_desktop','true');const removed=await (await fetch(base+'/api/admin/banner',{method:'POST',headers,body:f})).json();assert.equal(removed.desktopImage,'');assert.ok(removed.mobileImage);
  console.log('PASS: admin auth, same-origin protection, upload/read, live homepage, invalid input atomicity, image removal');
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise(resolve=>child.once('exit',resolve)); child.kill(); await exited;
  }
  rmSync(temp,{recursive:true,force:true});
}
