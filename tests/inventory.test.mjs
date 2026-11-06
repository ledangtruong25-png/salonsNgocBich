import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111',cashier='22222222-2222-4222-8222-222222222222',stranger='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444',salon='a1100000-0000-4000-8000-000000000001',second='a1100000-0000-4000-8000-000000000002';
const sql=n=>readFileSync(new URL('../supabase/'+n,import.meta.url),'utf8');let db;
before(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values('${owner}','owner@example.invalid'),('${cashier}','cashier@example.invalid'),('${stranger}','stranger@example.invalid'),('${other}','other@example.invalid');`);await db.exec(sql('migrations/202610280001_foundation.sql'));await db.exec(sql('01_bootstrap_demo.sql').replace('THAY_EMAIL_CHU_SALON','owner@example.invalid'));await db.exec(sql('02_add_staff.sql').replace('THAY_EMAIL_THU_NGAN','cashier@example.invalid'));await db.exec(sql('migrations/202610280002_counter.sql'));await db.exec(sql('migrations/202610290003_reconciliation.sql'));for (const name of ['202610290004_appointments','202610290005_appearance','202611020006_offline_drafts','202611060007_inventory']) await db.exec(sql('migrations/'+name+'.sql'));await db.exec(`insert into public.salons(id,name) values('${second}','Other salon');insert into public.profiles values('${other}','Other owner');insert into public.salon_members(salon_id,user_id,role) values('${second}','${other}','owner');`);});
after(async()=>{await db?.close();});
async function asUser(user,query,params=[],role='authenticated'){
 await db.exec('savepoint user_call');
 try {await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);await db.exec(`set local role ${role}`);const result=await db.query(query,params);await db.exec('reset role');await db.exec('release savepoint user_call');return result;}
 catch(e){await db.exec('rollback to savepoint user_call');await db.exec('release savepoint user_call');throw e;}
}
async function tx(fn){await db.exec('begin');try{await fn();}finally{await db.exec('rollback');}}
async function rpc(user,fn,args){return (await asUser(user,`select public.${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`,args)).rows[0].value;}
async function setup(user=owner){await rpc(owner,'open_session',[randomUUID(),100000]);await rpc(cashier,'open_session',[randomUUID(),100000]);const c=await rpc(user,'save_customer',[null,'Khách thật','0901234567']);const s=await rpc(owner,'save_service',[null,'Cắt tóc','Cắt','Tóc ngắn',150001,45,true]);return {c,s};}
async function order(c,s,extra={},user=cashier){const o={id:randomUUID(),revision:0,in:'2026-01-01T02:00:00Z',out:null,items:[{catalog_id:s,quantity:2}],type:'percent',discount:15,note:'Ghi chú thử',...extra};await rpc(user,'save_order',[o.id,o.revision,c,o.in,o.out,JSON.stringify(o.items),o.type,o.discount,o.note]);return o;}
async function pay(o,extra={}){const p={id:o.id,rev:1,request:randomUUID(),method:'cash',tendered:300000,out:'2026-01-01T04:00:00Z',...extra};const id=await rpc(cashier,'pay_order',[p.id,p.rev,p.request,p.method,p.tendered,p.out]);return {...p,payment:id};}
const material = () => rpc(owner,'save_material',[null,'Oxy','ml',10]);
const stock = async id => Number((await db.query('select stock from public.materials where id=$1',[id])).rows[0].stock);

test('payment aggregates consumption across services and repeats without double deduction',()=>tx(async()=>{
  const {c,s}=await setup();
  const secondService=await rpc(owner,'save_service',[null,'Nhuộm tóc','Nhuộm','',1000,45,true]);
  const id=await material();
  await rpc(owner,'set_service_material',[s,id,2.125]);
  await rpc(owner,'set_service_material',[secondService,id,4]);
  const o=await order(c,s,{items:[{catalog_id:s,quantity:2},{catalog_id:secondService,quantity:1}]});
  assert.equal(await stock(id),0);
  await assert.rejects(()=>pay(o,{tendered:100}),/INVALID_PAYMENT/);
  assert.equal(await stock(id),0);
  const payment=await pay(o);
  await pay(o,payment);
  assert.equal(await stock(id),-8.25);
  const {rows}=await db.query('select kind,delta,payment_id from public.stock_movements');
  assert.deepEqual(rows,[{kind:'sale',delta:'-8.250',payment_id:payment.payment}]);
  await rpc(owner,'refund_payment',[randomUUID(),payment.payment,1000,'Hoàn một phần']);
  assert.equal(await stock(id),-8.25);
}));

test('owner can receive and count stock, retries are safe and stale counts are rejected',()=>tx(async()=>{
  const id=await material();
  const receipt=[randomUUID(),id,'receipt',12.25,'Nhập đầu kỳ',null];
  await rpc(owner,'record_stock',receipt);
  await rpc(owner,'record_stock',receipt);
  assert.equal(await stock(id),12.25);
  await assert.rejects(()=>rpc(owner,'record_stock',[randomUUID(),id,'count',5,'Kiểm kê',0]),/STALE_STOCK/);
  await rpc(owner,'record_stock',[randomUUID(),id,'count',5,'Kiểm kê',12.25]);
  assert.equal(await stock(id),5);
  assert.deepEqual((await db.query('select delta from public.stock_movements order by delta')).rows.map(r=>Number(r.delta)),[-7.25,12.25]);
}));

test('inventory data and mutations are limited to the salon owner',()=>tx(async()=>{
  const id=await material();
  assert.equal((await asUser(cashier,'select id from public.materials')).rows.length,0);
  assert.equal((await asUser(other,'select id from public.materials')).rows.length,0);
  await assert.rejects(()=>rpc(cashier,'record_stock',[randomUUID(),id,'receipt',1,'Nhập',null]),/FORBIDDEN/);
  await assert.rejects(()=>rpc(other,'record_stock',[randomUUID(),id,'receipt',1,'Nhập',null]),/NOT_FOUND/);
  await assert.rejects(()=>asUser(owner,'update public.materials set stock=100'),/permission denied/i);
}));

test('offline sync and retry leave stock untouched until the synced order is paid',()=>tx(async()=>{
  const {s}=await setup();
  const id=await material();
  await rpc(owner,'set_service_material',[s,id,1.5]);
  const draft=randomUUID();
  const args=[draft,cashier,salon,'Khách offline','0912345678','2026-01-01T02:00:00Z',JSON.stringify([{catalog_id:s,quantity:1,unit_price:150001}]),'',true];
  await rpc(cashier,'sync_offline_draft',args);
  await rpc(cashier,'sync_offline_draft',args);
  assert.equal(await stock(id),0);
  assert.equal((await db.query('select id from public.stock_movements')).rows.length,0);
  await pay({id:draft});
  assert.equal(await stock(id),-1.5);
}));
