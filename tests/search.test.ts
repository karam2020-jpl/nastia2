import assert from 'node:assert/strict';
import test from 'node:test';
import {productQueryFromUrl} from '../app/search-utils.ts';

test('two consecutive header searches provide the latest query while staying on products',()=>{
 const first=productQueryFromUrl('/products?q=serum');
 const second=productQueryFromUrl('/products?q=Dior');
 assert.equal(first,'serum');
 assert.equal(second,'Dior');
 assert.notEqual(second,first);
});
