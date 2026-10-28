import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const root=new URL('../',import.meta.url);
const owner='11111111-1111-4111-8111-111111111111';
const cashier='22222222-2222-4222-8222-222222222222';
const stranger='33333333-3333-4333-8333-333333333333';
const other='44444444-4444-4444-8444-444444444444';
const salon='a1100000-0000-4000-8000-000000000001';
const second='a1100000-0000-4000-8000-000000000002';
let db;
const bootstrap=readFileSync(new URL('supabase/01_bootstrap_demo.sql',root),'utf8').replace('THAY_EMAIL_CHU_SALON','owner@example.invalid');
before(async()=>{
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,public to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;
    insert into auth.users values('${owner}','owner@example.invalid'),('${cashier}','cashier@example.invalid'),('${stranger}','stranger@example.invalid'),('${other}','other@example.invalid');`);
  await db.exec(readFileSync(new URL('supabase/migrations/202610280001_foundation.sql',root),'utf8'));
  await db.exec(bootstrap);
  await db.exec(readFileSync(new URL('supabase/02_add_staff.sql',root),'utf8').replace('THAY_EMAIL_THU_NGAN','cashier@example.invalid'));
  await db.exec(`insert into public.salons(id,name) values('${second}','Other salon');
    insert into public.profiles values('${other}','Other owner');
    insert into public.salon_members(salon_id,user_id,role) values('${second}','${other}','owner');
    insert into public.customers(salon_id,full_name,last_visit) values('${second}','Private other customer',now());`);
  await db.exec(readFileSync(new URL('supabase/03_verify_setup.sql',root),'utf8'));
});
after(async()=>{await db?.close();});
async function asUser(user,sql,params=[],role='authenticated') {
  await db.exec('begin');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);
    await db.exec(`set local role ${role}`);
    return await db.query(sql,params);
  } finally { await db.exec('rollback'); }
}
test('migration enables RLS on every application table',async()=>{
  const r=await db.query("select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r'");
  assert.equal(r.rows.length,6); assert.ok(r.rows.every(r=>r.relrowsecurity));
});
test('bootstrap can be repeated without duplicates or overwriting salon settings',async()=>{
  await db.query('update public.salons set name=$1 where id=$2',['Tên salon đã sửa',salon]);
  await db.exec(bootstrap);
  const result=await db.query('select (select count(*)::int from public.orders) as orders,(select name from public.salons where id=$1) as name',[salon]);
  assert.deepEqual(result.rows[0],{orders:8,name:'Tên salon đã sửa'});
});
test('owner reads only own salon samples; aggregates match demo fixtures',async()=>{
  const r=await asUser(owner,'select count(*)::int as count from public.customers'); assert.equal(r.rows[0].count,6);
  const s=await asUser(owner,"select sum(total)::int as value from public.orders where status='completed'"); assert.equal(s.rows[0].value,2520000);
  const team=await asUser(owner,'select user_id from public.salon_members'); assert.equal(team.rows.length,2);
});
test('cashier sees own membership only and no other staff profile',async()=>{
  const r=await asUser(cashier,'select * from public.salon_members'); assert.equal(r.rows.length,1); assert.equal(r.rows[0].role,'cashier');
  const p=await asUser(cashier,'select id from public.profiles'); assert.deepEqual(p.rows,[{id:cashier}]);
  const c=await asUser(cashier,'select id from public.orders'); assert.equal(c.rows.length,8);
});
test('cashier cannot modify salon settings; owner can update allowed columns',async()=>{
  const r=await asUser(cashier,'update public.salons set name=$1 where id=$2 returning id',['Không được lưu',salon]); assert.equal(r.rows.length,0);
  const o=await asUser(owner,'update public.salons set name=$1 where id=$2 returning name',['Được lưu',salon]); assert.equal(o.rows[0].name,'Được lưu');
  await assert.rejects(()=>asUser(owner,"update public.salons set timezone='UTC' where id=$1",[salon]),/permission denied/i);
});
test('roles cannot be escalated through direct API writes',async()=>{
  await assert.rejects(()=>asUser(cashier,"update public.salon_members set role='owner' where user_id=$1",[cashier]),/permission denied/i);
  await assert.rejects(()=>asUser(owner,"insert into public.orders(salon_id,code) values($1,'ILLEGAL')",[salon]),/permission denied/i);
});
test('stranger and cross-salon account cannot read this salon',async()=>{
  const r=await asUser(stranger,'select id from public.salons'); assert.equal(r.rows.length,0);
  const c=await asUser(other,'select full_name from public.customers'); assert.deepEqual(c.rows,[{full_name:'Private other customer'}]);
  const o=await asUser(other,'select id from public.orders'); assert.equal(o.rows.length,0);
});
test('anonymous requests cannot read business data',async()=>{
  await assert.rejects(()=>asUser(null,'select * from public.customers',[],'anon'),/permission denied/i);
});
test('deactivating membership revokes data access despite a valid user identity',async()=>{
  await db.query('update public.salon_members set active=false where user_id=$1',[cashier]);
  const r=await asUser(cashier,'select * from public.orders'); assert.equal(r.rows.length,0);
  const m=await asUser(cashier,'select * from public.salon_members'); assert.equal(m.rows.length,0);
});
