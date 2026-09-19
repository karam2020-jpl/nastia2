import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ensureAccounts,bootstrapOwner,authenticate,sessionUser,createAccount,updateAccount,listAccounts,verifyPassword,tokenHash} from '../app/admin-accounts.ts';
import {can} from '../app/admin-permissions.ts';
const password='test-only-strong-password';
test('role matrix excludes customer information and account management from other staff',()=>{
  for(const role of ['owner','orders','products','content'] as const)
    for(const permission of ['orders','products','content','delivery','users','audit'] as const)
      assert.equal(can(role,permission),role==='owner'||role===permission);
});
test('accounts persist, environment bootstrap cannot override them, role/password/disable revoke sessions',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'nastia-accounts-'));let db=new DatabaseSync(join(dir,'db.sqlite'));
  try{
    ensureAccounts(db);await bootstrapOwner(db,'admin',password);const ownerLogin=await authenticate(db,'admin',password);const owner=ownerLogin.user;
    const row=db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(owner.id)!;
    assert.notEqual(row.password_hash,password);assert.ok(await verifyPassword(password,String(row.password_hash)));
    assert.equal(db.prepare('SELECT token_hash FROM admin_sessions').get()?.token_hash,tokenHash(ownerLogin.token));
    assert.equal(sessionUser(db,'123.old-signature'),null);
    assert.equal(sessionUser(db,ownerLogin.token,Date.now()+9*60*60*1000),null);
    await assert.rejects(updateAccount(db,owner,owner.id,{name:'Owner',role:'orders',active:true}));
    await assert.rejects(updateAccount(db,owner,owner.id,{name:'Owner',role:'owner',active:false}));
    const id=await createAccount(db,owner,{username:'staff',name:'Staff',role:'products',active:true,password});
    await assert.rejects(createAccount(db,owner,{username:'STAFF',name:'Duplicate',role:'orders',active:true,password}));
    let staff=await authenticate(db,'staff',password);assert.equal(sessionUser(db,staff.token)?.role,'products');
    await assert.rejects(createAccount(db,staff.user,{username:'evil',name:'Evil',role:'owner',active:true,password}));
    await updateAccount(db,owner,id,{name:'Staff',role:'orders',active:true});assert.equal(sessionUser(db,staff.token),null);
    staff=await authenticate(db,'staff',password);
    await updateAccount(db,owner,id,{name:'Staff',role:'orders',active:true,password:password+'-new'});assert.equal(sessionUser(db,staff.token),null);
    await assert.rejects(authenticate(db,'staff',password));staff=await authenticate(db,'staff',password+'-new');
    await updateAccount(db,owner,id,{name:'Staff',role:'orders',active:false});assert.equal(sessionUser(db,staff.token),null);
    await assert.rejects(authenticate(db,'staff',password+'-new'));
    await bootstrapOwner(db,'replacement','another-password');assert.equal(listAccounts(db).length,2);
    assert.ok(listAccounts(db).every(u=>!('password_hash' in u)));
    const logs=JSON.stringify(db.prepare('SELECT * FROM admin_audit').all());assert.ok(!logs.includes(password));assert.ok(!logs.includes(ownerLogin.token));
    db.close();db=new DatabaseSync(join(dir,'db.sqlite'));ensureAccounts(db);assert.equal(listAccounts(db).length,2);assert.ok(sessionUser(db,ownerLogin.token));
  }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
test('login throttling blocks further attempts after five failures',async()=>{
  const db=new DatabaseSync(':memory:');ensureAccounts(db);await bootstrapOwner(db,'admin',password);
  try{for(let n=0;n<5;n++)await assert.rejects(authenticate(db,'admin','wrong'),{status:401});await assert.rejects(authenticate(db,'admin',password),{status:429});}
  finally{db.close();}
});
