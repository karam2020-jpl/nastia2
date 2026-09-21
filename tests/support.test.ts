import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {ensureAccounts,bootstrapOwner,authenticate,sessionUser,createAccount} from '../app/admin-accounts.ts';
import {ensureSupport,createTicket,customerTicket,reply} from '../app/support-store.ts';
test('old account schema migrates preserving owner and session and allowing support role',async()=>{
 const db=new DatabaseSync(':memory:');db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE admin_users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','orders','products','content')),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE admin_sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER REFERENCES admin_users(id),expires_at INTEGER);
 CREATE TABLE admin_audit(id INTEGER PRIMARY KEY,actor_id INTEGER,actor_name TEXT,action TEXT,target TEXT,details TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE admin_login_limits(username TEXT PRIMARY KEY,attempts INTEGER,expires_at INTEGER);`);
 await bootstrapOwner(db,'owner','test-owner-password');const session=await authenticate(db,'owner','test-owner-password');const fresh=session;
 ensureAccounts(db);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
 assert.equal(sessionUser(db,fresh.token)?.id,session.user.id);await createAccount(db,session.user,{username:'helper',name:'الدعم',role:'support',active:true,password:'support-password'});assert.equal((await authenticate(db,'helper','support-password')).user.role,'support');ensureAccounts(db);db.close();
});
test('support requires secret, excludes secret hashes, stores replies and throttles creation',()=>{const db=new DatabaseSync(':memory:');ensureSupport(db);const input={name:'عميل',phone:'07701234567',order:'',category:'شكوى',body:'مشكلة'};const access=createTicket(db,input);assert.throws(()=>customerTicket(db,access.id,'0'.repeat(32)));assert.equal(Object.hasOwn(customerTicket(db,access.id,access.code),'access_hash'),false);reply(db,access.id,'الدعم','تم الحل');assert.equal((customerTicket(db,access.id,access.code).messages[0]).body,'تم الحل');for(let i=0;i<4;i++)createTicket(db,input);assert.throws(()=>createTicket(db,input),/محاولات/);db.close();});
