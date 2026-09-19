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
const port = 3198, base = `http://127.0.0.1:${port}`;
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
  const loginAs=async(username,pass=password)=>{
    const r=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({username,password:pass})});
    assert.equal(r.status,200,await r.text());return r.headers.get('set-cookie').split(';')[0];
  };
  const root=await loginAs('banner-test');
  const req=(path,cookie,method='GET',data)=>fetch(base+path,{method,headers:{Cookie:cookie,Origin:base,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
  const endpoints={orders:'/api/admin/orders',products:'/api/admin/products',content:'/api/admin/banner',delivery:'/api/admin/fees',users:'/api/admin/users',audit:'/api/admin/audit'};
  const cookies={},ids={};
  for(const role of ['orders','products','content']){
    let r=await req('/api/admin/users',root,'POST',{username:role,name:role,role,active:true,password});assert.equal(r.status,201);ids[role]=(await r.json()).id;cookies[role]=await loginAs(role);
    for(const [permission,path] of Object.entries(endpoints)){
      assert.equal((await req(path,cookies[role])).status,permission===role?200:403,role+' GET '+path);
      if(permission!==role&&permission!=='audit')assert.equal((await req(path,cookies[role],permission==='orders'?'PATCH':'POST',{})).status,403,role+' write '+path);
    }
  }
  const publicUsers=await (await req('/api/admin/users',root)).json();assert.ok(publicUsers.every(u=>!('password_hash' in u)));
  const owner=publicUsers.find(u=>u.role==='owner');
  assert.equal((await req('/api/admin/users',root,'PATCH',{id:owner.id,name:'Owner',role:'orders',active:true})).status,400);
  assert.equal((await fetch(base+'/api/admin/users',{method:'POST',headers:{Cookie:root,Origin:'https://evil.test'}})).status,403);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBz0AAAAASUVORK5CYII=','base64');
  const product={id:'four-images',name:'Four pictures',brand:'Nastia',category:'المكياج',description:'Test product',price:12300,stock:4,shades:['red'],sizes:['one'],color:'#ffffff'};
  const upload=async(p,manifest,newFiles=[])=>{
    const f=new FormData();f.set('product',JSON.stringify(p));f.set('images',JSON.stringify(manifest));
    newFiles.forEach((bytes,i)=>f.set('image-'+i,new Blob([bytes],{type:'image/png'}),'image.png'));
    return fetch(base+'/api/admin/products',{method:'POST',headers:{Cookie:cookies.products,Origin:base},body:f});
  };
  let r=await upload(product,[0,1,2,3].map(i=>({upload:'image-'+i})),[png,png,png,png]);assert.equal(r.status,200,await r.clone().text());let saved=await r.json();assert.equal(saved.images.length,4);
  const catalog=await (await fetch(base+'/api/catalog')).json();assert.equal(catalog.products.find(p=>p.id===product.id).images.length,4);
  for(const image of saved.images){const response=await fetch(base+image.url);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);}
  const before=saved.images;
  r=await upload(product,before.slice().reverse().map(i=>({id:i.id})));assert.equal(r.status,200);saved=await r.json();assert.equal(saved.images[0].id,before[3].id);
  r=await upload({...product,name:'must not save'},[...before.map(i=>({id:i.id})),{upload:'image-0'}],[png]);assert.equal(r.status,400);
  r=await upload({...product,name:'must not save'},[{upload:'image-0'}],[Buffer.from('<svg/>')]);assert.equal(r.status,400);
  r=await upload({...product,id:'other-product'},[{id:before[0].id}]);assert.equal(r.status,400);
  const again=await (await req('/api/admin/products',cookies.products)).json();assert.equal(again.find(p=>p.id===product.id).name,product.name);assert.ok(!again.find(p=>p.id==='other-product'));
  const customer={fullName:'Test Customer',phone:'07701234567',province:'بغداد',city:'بغداد',district:'المنصور',block:'1',street:'2',building:'3',apartment:'4',landmark:'قرب السوق',notes:'test'};
  r=await fetch(base+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer,items:[{productId:product.id,shade:'red',size:'one',quantity:1}]})});assert.equal(r.status,201,await r.clone().text());const order=await r.json();
  assert.equal((await req('/api/admin/orders',cookies.orders,'PATCH',{id:order.id,status:'مؤكد'})).status,200);
  await req('/api/admin/users',root,'PATCH',{id:ids.products,name:'Products',role:'content',active:true});assert.equal((await req('/api/admin/products',cookies.products)).status,401);
  const moved=await loginAs('products');assert.equal((await req('/api/admin/products',moved)).status,403);assert.equal((await req('/api/admin/banner',moved)).status,200);
  await req('/api/admin/users',root,'PATCH',{id:ids.content,name:'Content',role:'content',active:false});assert.equal((await req('/api/admin/banner',cookies.content)).status,401);
  await req('/api/admin/users',root,'PATCH',{id:ids.orders,name:'Orders',role:'orders',active:true,password:password+'new'});assert.equal((await req('/api/admin/orders',cookies.orders)).status,401);
  const newCookie=await loginAs('orders',password+'new');assert.equal((await req('/api/admin/orders',newCookie)).status,200);
  await req('/api/admin/logout',newCookie,'POST');assert.equal((await req('/api/admin/orders',newCookie)).status,401);
  const auditRows=await (await req('/api/admin/audit',root)).json();assert.ok(auditRows.some(x=>x.action==='حفظ منتج'));assert.ok(auditRows.some(x=>x.action==='تغيير حالة الطلب'));assert.ok(!JSON.stringify(auditRows).includes(password));
  console.log('PASS: role API matrix, denied writes, account safety, 4 image upload/gallery/order, atomic failure, revocation, password reset, logout, audit');
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise(resolve=>child.once('exit',resolve)); child.kill(); await exited;
  }
  rmSync(temp,{recursive:true,force:true});
}
