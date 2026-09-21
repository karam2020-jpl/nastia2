import assert from 'node:assert/strict';
import test from 'node:test';
import {deliveryForProvince,isValidIraqiPhone,normalizeIraqiPhone,shouldShowAddressFields,validateCheckout} from '../app/checkout-utils.ts';

const valid={fullName:'سارة محمد',phone:'07701234567',province:'بغداد',city:'بغداد',district:'المنصور',block:'',street:'شارع 14',building:'',apartment:'',landmark:'قرب المكتبة',notes:''};

test('address fields appear only after selecting a province',()=>{
 assert.equal(shouldShowAddressFields(''),false);
 assert.equal(shouldShowAddressFields('بغداد'),true);
});

test('delivery fee follows the selected province',()=>{
 const fees={بغداد:5000,البصرة:8000};
 assert.equal(deliveryForProvince('',fees),undefined);
 assert.equal(deliveryForProvince('بغداد',fees),5000);
 assert.equal(deliveryForProvince('البصرة',fees),8000);
});

test('Iraqi phone validation accepts local and international forms and Arabic digits',()=>{
 assert.equal(isValidIraqiPhone('0770 123 4567'),true);
 assert.equal(isValidIraqiPhone('+9647 70123 4567'),true);
 assert.equal(normalizeIraqiPhone('٠٧٧٠ ١٢٣ ٤٥٦٧'),'07701234567');
 assert.equal(isValidIraqiPhone('7701234567'),false);
 assert.equal(isValidIraqiPhone('071234'),false);
});

test('required Iraqi address fields return adjacent-field errors',()=>{
 const errors=validateCheckout({...valid,city:'',district:'',street:'',landmark:''});
 assert.deepEqual(Object.keys(errors).sort(),['city','district','landmark','street']);
 assert.deepEqual(validateCheckout(valid),{});
});
