import assert from 'node:assert/strict';import test from 'node:test';import {makeSessionToken,verifySessionToken} from '../app/session-utils.ts';
const secret='a-secure-test-secret-with-more-than-32-characters';
test('admin access rejects missing, forged and expired sessions',()=>{const now=1_800_000_000_000;assert.equal(verifySessionToken(undefined,secret,now),false);assert.equal(verifySessionToken(`${now}.forged`,secret,now),false);assert.equal(verifySessionToken(makeSessionToken(String(now-9*60*60*1000),secret),secret,now),false)});
test('a correctly signed current admin session is accepted',()=>{const now=1_800_000_000_000;assert.equal(verifySessionToken(makeSessionToken(String(now),secret),secret,now),true)});
