import assert from 'node:assert/strict';
import test from 'node:test';
import {addCartLine,cartLineKey,changeCartLine,cleanProductOptions,parseStoredCart,productQuantityInCart,readCartStorage,reconcileCart,removeCartLine,sanitizeProduct,updateDeliveryFee,writeCartStorage} from '../app/store-utils.ts';

const product={id:'lipstick',name:'Rouge',brand:'Dior',category:'المكياج',price:54000,description:'test',shades:['وردي','أحمر'],sizes:['3.5 غم'],stock:5,color:'#fff'};
const variants=[{product,qty:1,shade:'وردي',size:'3.5 غم'},{product,qty:2,shade:'أحمر',size:'3.5 غم'}];

test('quantity and deletion target only the matching product variant',()=>{
 const changed=changeCartLine(variants,cartLineKey('lipstick','وردي','3.5 غم'),4);
 assert.equal(changed[0].qty,3);assert.equal(changed[1].qty,2);
 const remaining=removeCartLine(changed,cartLineKey('lipstick','أحمر','3.5 غم'));
 assert.equal(remaining.length,1);assert.equal(remaining[0].shade,'وردي');
});
test('all variants share the product-level stock limit',()=>{
 let cart=variants;
 cart=addCartLine(cart,product,'وردي','3.5 غم');
 cart=addCartLine(cart,product,'أحمر','3.5 غم');
 assert.equal(productQuantityInCart(cart,product.id),5);
 assert.strictEqual(addCartLine(cart,product,'أحمر','3.5 غم'),cart);
 const synced=reconcileCart([{...variants[0],qty:4},{...variants[1],qty:4}],[product]);
 assert.equal(productQuantityInCart(synced,product.id),5);
 assert.deepEqual(synced.map((item)=>item.qty),[4,1]);
});
test('stored cart parser rejects malformed JSON and invalid rows',()=>{
 assert.deepEqual(parseStoredCart('{bad'),[]);assert.deepEqual(parseStoredCart('{}'),[]);
 assert.deepEqual(parseStoredCart(JSON.stringify([...variants,{product,qty:-1,shade:'وردي',size:'3.5 غم'}])),variants);
});
test('storage access failures are contained',()=>{
 const broken={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}};
 assert.deepEqual(readCartStorage(broken),[]);
 assert.equal(writeCartStorage(broken,variants),false);
});
test('delivery and product admin values cannot become negative',()=>{
 assert.equal(updateDeliveryFee({بغداد:5000},'بغداد',-5).بغداد,0);
 assert.deepEqual(sanitizeProduct({...product,price:-1,stock:-2}),{...product,price:0,stock:0});
});
test('cart follows current product price, stock and available options',()=>{
 const current={...product,price:61000,stock:1,shades:['وردي']};
 const result=reconcileCart(variants,[current]);
 assert.equal(result.length,1);assert.equal(result[0].shade,'وردي');
 assert.equal(result[0].qty,1);assert.equal(result[0].product.price,61000);
});
test('deleted and unavailable products cannot remain in checkout cart',()=>{
 assert.deepEqual(reconcileCart(variants,[]),[]);
 assert.deepEqual(reconcileCart(variants,[{...product,stock:0}]),[]);
});
test('product options are cleaned and empty option lists are detectable',()=>{
 assert.deepEqual(cleanProductOptions(['  وردي  ','', '   ']),['وردي']);
 assert.equal(cleanProductOptions(['', '   ']).length,0);
});
