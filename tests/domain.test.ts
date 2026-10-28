import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, summarize, settingsInput, vietnamDate, vietnamTime, validEmail, validPassword, isPublicKey } from '../src/lib/domain.ts';
test('configuration refuses privileged keys',()=>{
  assert.equal(isPublicKey('sb_secret_never_use_this_key'),false);
  assert.equal(isPublicKey('sb_publishable_public_example'),true);
  const key=(role:string)=>'eyJ.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.example';
  assert.equal(isPublicKey(key('service_role')),false);
  assert.equal(isPublicKey(key('anon')),true);
  assert.equal(isPublicKey('YOUR_SUPABASE_PUBLISHABLE_KEY'),false);
});
test('auth callback cannot redirect to an external site',()=>{
  for(const value of ['https://attacker.invalid','//attacker.invalid','/\\attacker.invalid','/update-password?next=//bad','%2f%2fevil',null]) assert.equal(safeNext(value),'/app');
  assert.equal(safeNext('/update-password'),'/update-password');
});
test('Vietnam time groups timestamps across UTC midnight correctly',()=>{
  assert.equal(vietnamDate('2026-10-31T17:20:00Z'),'01/11/2026');
  assert.equal(vietnamTime('2026-10-31T17:20:00Z'),'00:20');
});
test('sample value counts completed orders only, and empty data is safe',()=>{
  assert.deepEqual(summarize([{total:650000,status:'completed'},{total:200000,status:'completed'},{total:800000,status:'cancelled'},{total:120000,status:'serving'}]),{completed:2,serving:1,value:850000,visits:3});
  assert.deepEqual(summarize([]),{completed:0,serving:0,value:0,visits:0});
});
test('salon settings reject invalid inputs and normalize values',()=>{
  assert.ok(settingsInput({name:'x',phone:'',address:''}).error);
  assert.ok(settingsInput({name:'Salon',phone:'not-a-number',address:''}).error);
  assert.ok(settingsInput({name:'Salon',phone:'',address:'a'.repeat(251)}).error);
  assert.deepEqual(settingsInput({name:'  Mộc Salon ',phone:' +84 900 000 000 ',address:'  Địa chỉ mẫu '}),{value:{name:'Mộc Salon',phone:'+84 900 000 000',address:'Địa chỉ mẫu'}});
});
test('email and new password bounds are enforced',()=>{
  assert.equal(validEmail('chu@example.invalid'),true);
  assert.equal(validEmail('bad@'),false);
  assert.equal(validEmail('a b@example.com'),false);
  assert.equal(validPassword('x'.repeat(11)),false);
  assert.equal(validPassword('x'.repeat(12)),true);
  assert.equal(validPassword('x'.repeat(129)),false);
});
