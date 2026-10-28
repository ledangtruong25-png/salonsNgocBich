-- Create a confirmed user first in Authentication > Users > Add user > Create user.
-- Edit staff_email, then run this file in SQL Editor as project administrator.
-- To disable a staff account later, set active=false in Table Editor / salon_members.
do $$
declare
  staff_email text := 'THAY_EMAIL_THU_NGAN';
  staff_name text := 'Thu ngân';
  staff_id uuid;
  target_salon uuid := 'a1100000-0000-4000-8000-000000000001';
begin
  select id into staff_id from auth.users where lower(email) = lower(trim(staff_email));
  if staff_id is null then raise exception 'Create this user in Authentication > Users first, then replace staff_email.'; end if;
  if not exists(select 1 from public.salons where id = target_salon) then raise exception 'Run 01_bootstrap_demo.sql first.'; end if;
  if exists(select 1 from public.salon_members where user_id = staff_id and role = 'owner') then raise exception 'This user is an owner. Use a different staff account.'; end if;
  insert into public.profiles(id,full_name) values(staff_id,staff_name)
    on conflict(id) do update set full_name = excluded.full_name;
  insert into public.salon_members(salon_id,user_id,role,active) values(target_salon,staff_id,'cashier',true)
    on conflict(salon_id,user_id) do update set active=true;
end $$;
