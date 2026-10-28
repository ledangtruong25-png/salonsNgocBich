// Maintainer helper. Generates the static seed from the same fixture as /demo.
import { readFileSync, writeFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../src/lib/demo.json', import.meta.url), 'utf8'));
const q = v => v === null ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : "'" + v.replaceAll("'", "''") + "'";
let sql = `-- Salon Manager v0.1.0. Fake data only; no real personal or payment data.\n-- 1. Run the migration. 2. Create a confirmed owner in Authentication > Users.\n-- 3. Replace owner_email below. 4. Run this file in SQL Editor.\n-- Rerunning adds missing fixtures; it does not reset existing salon settings.\ndo $$\ndeclare\n  owner_email text := 'THAY_EMAIL_CHU_SALON';\n  owner_name text := 'Chủ salon';\n  owner_id uuid;\n  target_salon uuid := '${data.salon.id}';\nbegin\n  select id into owner_id from auth.users where lower(email)=lower(trim(owner_email));\n  if owner_id is null then raise exception 'Create the owner in Authentication > Users, then replace owner_email in this script.'; end if;\n  if exists(select 1 from public.salon_members where user_id=owner_id and (salon_id<>target_salon or role<>'owner')) then raise exception 'This account already has another membership. Choose a fresh test owner.'; end if;\n  insert into public.salons(id,name,phone,address) values(target_salon,${q(data.salon.name)},'',${q(data.salon.address)}) on conflict(id) do nothing;\n  if exists(select 1 from public.salon_members where salon_id=target_salon and role='owner' and user_id<>owner_id) then raise exception 'A different owner already exists. Do not rerun bootstrap to change ownership.'; end if;\n  insert into public.profiles(id,full_name) values(owner_id,owner_name) on conflict(id) do nothing;\n  insert into public.salon_members(salon_id,user_id,role,active) values(target_salon,owner_id,'owner',true) on conflict(salon_id,user_id) do nothing;\n`;
for(const [fixture, tbl] of [['customers','customers'],['services','catalog_items'],['orders','orders']]) {
  for(const item of data[fixture]) {
    const row = {...item, salon_id:data.salon.id};
    if(fixture === 'orders') row.customer_id = data.customers.find(c=>c.full_name===item.customer_name)?.id ?? null;
    sql += `  insert into public.${tbl}(${Object.keys(row).join(',')}) values(${Object.values(row).map(q).join(',')}) on conflict(id) do nothing;\n`;
  }
}
sql += 'end $$;\n';
writeFileSync(new URL('../supabase/01_bootstrap_demo.sql',import.meta.url),sql);
console.log('Generated supabase/01_bootstrap_demo.sql');
