import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const owner='11111111-1111-4111-8111-111111111111',cashier='22222222-2222-4222-8222-222222222222',stranger='33333333-3333-4333-8333-333333333333',other='44444444-4444-4444-8444-444444444444',salon='a1100000-0000-4000-8000-000000000001',second='a1100000-0000-4000-8000-000000000002';
const sql=n=>readFileSync(new URL('../supabase/'+n,import.meta.url),'utf8');let db;
before(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users values('${owner}','owner@example.invalid'),('${cashier}','cashier@example.invalid'),('${stranger}','stranger@example.invalid'),('${other}','other@example.invalid');`);await db.exec(sql('migrations/202610280001_foundation.sql'));await db.exec(sql('01_bootstrap_demo.sql').replace('THAY_EMAIL_CHU_SALON','owner@example.invalid'));await db.exec(sql('02_add_staff.sql').replace('THAY_EMAIL_THU_NGAN','cashier@example.invalid'));await db.exec(sql('migrations/202610280002_counter.sql'));await db.exec(sql('migrations/202610290003_reconciliation.sql'));for (const name of ['202610290004_appointments','202610290005_appearance','202611020006_offline_drafts','202611060007_inventory','202611060008_commissions']) await db.exec(sql('migrations/'+name+'.sql'));await db.exec(`insert into public.salons(id,name) values('${second}','Other salon');insert into public.profiles values('${other}','Other owner');insert into public.salon_members(salon_id,user_id,role) values('${second}','${other}','owner');`);});
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
async function pay(o,extra={}){const p={id:o.id,rev:1,request:randomUUID(),method:'cash',tendered:300000,out:'2026-01-01T04:00:00Z',...extra};const args=[p.id,p.rev,p.request,p.method,p.tendered,p.out]; const id=p.assignments?await rpc(cashier,'pay_order_with_commission',[...args,JSON.stringify(p.assignments)]):await rpc(cashier,'pay_order',args);return {...p,payment:id};}
const entries=async()=> (await db.query('select stylist_name,service_name,basis,amount,rate,refund_id from public.commission_entries order by refund_id nulls first,service_name')).rows;
const line=async id=>(await db.query('select id from public.order_items where order_id=$1',[id])).rows[0].id;

test('assignment, proportional discount, snapshots, retry, refund and report run through real RPCs',()=>tx(async()=>{
  const {c,s}=await setup();
  const st=await rpc(owner,'save_stylist',['Thợ An',null,true]);
  const mat=await rpc(owner,'save_material',[null,'Oxy','ml',1]);
  await rpc(owner,'set_service_material',[s,mat,2]);
  await rpc(owner,'set_commission_rate',[s,20]);
  const o=await order(c,s);
  const assignments={[await line(o.id)]:st};
  await assert.rejects(()=>pay(o,{assignments,tendered:1}),/INVALID_PAYMENT/);
  assert.equal((await entries()).length,0);
  const p=await pay(o,{assignments});
  await pay(o,p);
  await rpc(owner,'set_commission_rate',[s,50]);
  await rpc(owner,'save_stylist',['Tên mới',st,true]);
  assert.deepEqual(await entries(),[{stylist_name:'Thợ An',service_name:'Cắt tóc · Tóc ngắn',basis:255002,amount:51000,rate:'20.00',refund_id:null}]);
  assert.equal((await db.query('select stock from public.materials where id=$1',[mat])).rows[0].stock,'-4.000');
  const first=randomUUID(),second=randomUUID();
  await rpc(owner,'refund_payment',[first,p.payment,1,'Hoàn một phần']);
  await rpc(owner,'refund_payment',[first,p.payment,1,'Hoàn một phần']);
  await rpc(owner,'refund_payment',[second,p.payment,255001,'Hoàn phần còn lại']);
  const rows=await entries();
  assert.equal(rows.length,3);
  assert.equal(rows.reduce((sum,row)=>sum+row.amount,0),0);
  const {rows:[report]}=await asUser(owner,"select * from public.commission_report((now() at time zone 'Asia/Ho_Chi_Minh')::date,(now() at time zone 'Asia/Ho_Chi_Minh')::date)");
  assert.deepEqual(report,{stylist_id:st,stylist_name:'Tên mới',earned:51000,reversed:51000,net:0});
}));

test('payment without explicit assignments inherits the booked stylist',()=>tx(async()=>{
  const {c,s}=await setup();
  const st=await rpc(owner,'save_stylist',['Thợ Bình',null,true]);
  await rpc(owner,'set_commission_rate',[s,10]);
  const appointment=randomUUID();
  await rpc(cashier,'save_appointment',[appointment,0,c,st,'2026-01-01T02:00:00Z','2026-01-01T03:00:00Z',JSON.stringify([{catalog_id:s,quantity:1}]),false,'','']);
  const id=await rpc(cashier,'appointment_status',[appointment,1,'arrived']);
  await pay({id},{out:new Date().toISOString()});
  assert.equal((await entries())[0].stylist_name,'Thợ Bình');
}));

test('cross salon assignment is rejected and only owner can see ledger or set rates',()=>tx(async()=>{
  const {c,s}=await setup();
  const st=await rpc(other,'save_stylist',['Thợ salon khác',null,true]);
  await assert.rejects(()=>rpc(cashier,'set_commission_rate',[s,10]),/FORBIDDEN/);
  await assert.rejects(()=>rpc(owner,'set_commission_rate',[s,10.001]),/INVALID_COMMISSION_RATE/);
  const o=await order(c,s);
  const id=await line(o.id);
  await assert.rejects(()=>pay(o,{assignments:{[id]:st}}),/INVALID_STYLIST/);
  await pay(o);
  assert.equal((await entries()).length,0);
  assert.equal((await asUser(cashier,'select * from public.commission_entries')).rows.length,0);
  await assert.rejects(()=>asUser(cashier,"select * from public.commission_report('2026-01-01','2026-01-02')"),/FORBIDDEN/);
}));

test('discount allocation preserves total VND across two lines with separate stylists',()=>tx(async()=>{
  const {c}=await setup();
  const a=await rpc(owner,'save_service',[null,'Dịch vụ A','Cắt','',3,45,true]);
  const b=await rpc(owner,'save_service',[null,'Dịch vụ B','Cắt','',3,45,true]);
  const stA=await rpc(owner,'save_stylist',['Thợ An',null,true]);
  const stB=await rpc(owner,'save_stylist',['Thợ Bình',null,true]);
  await rpc(owner,'set_commission_rate',[a,100]);
  await rpc(owner,'set_commission_rate',[b,100]);
  const o=await order(c,a,{type:'fixed',discount:5,items:[{catalog_id:a,quantity:1},{catalog_id:b,quantity:1}]});
  const {rows}=await db.query('select id,catalog_id from public.order_items where order_id=$1',[o.id]);
  await pay(o,{tendered:1,assignments:Object.fromEntries(rows.map(r=>[r.id,r.catalog_id===a?stA:stB]))});
  assert.equal((await entries()).reduce((sum,row)=>sum+row.amount,0),1);
}));
