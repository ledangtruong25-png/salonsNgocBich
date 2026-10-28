-- Salon Manager v0.1.0. Fake data only; no real personal or payment data.
-- 1. Run the migration. 2. Create a confirmed owner in Authentication > Users.
-- 3. Replace owner_email below. 4. Run this file in SQL Editor.
-- Rerunning adds missing fixtures; it does not reset existing salon settings.
do $$
declare
  owner_email text := 'THAY_EMAIL_CHU_SALON';
  owner_name text := 'Chủ salon';
  owner_id uuid;
  target_salon uuid := 'a1100000-0000-4000-8000-000000000001';
begin
  select id into owner_id from auth.users where lower(email)=lower(trim(owner_email));
  if owner_id is null then raise exception 'Create the owner in Authentication > Users, then replace owner_email in this script.'; end if;
  if exists(select 1 from public.salon_members where user_id=owner_id and (salon_id<>target_salon or role<>'owner')) then raise exception 'This account already has another membership. Choose a fresh test owner.'; end if;
  insert into public.salons(id,name,phone,address) values(target_salon,'Mộc Hair Studio','','Địa chỉ salon chưa được cấu hình') on conflict(id) do nothing;
  if exists(select 1 from public.salon_members where salon_id=target_salon and role='owner' and user_id<>owner_id) then raise exception 'A different owner already exists. Do not rerun bootstrap to change ownership.'; end if;
  insert into public.profiles(id,full_name) values(owner_id,owner_name) on conflict(id) do nothing;
  insert into public.salon_members(salon_id,user_id,role,active) values(target_salon,owner_id,'owner',true) on conflict(salon_id,user_id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000001','Khách mẫu Linh',null,5,'2026-10-28T02:00:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000002','Khách mẫu Minh',null,3,'2026-10-28T02:30:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000003','Khách mẫu Thảo',null,2,'2026-10-28T03:00:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000004','Khách mẫu An',null,7,'2026-10-28T04:00:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000005','Khách mẫu Ngọc',null,1,'2026-10-28T06:00:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.customers(id,full_name,phone,visits,last_visit,is_demo,salon_id) values('c1100000-0000-4000-8000-000000000006','Khách mẫu Huy',null,4,'2026-10-28T07:00:00Z',true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000001','Cắt & tạo kiểu','Cắt tóc',150000,45,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000002','Nhuộm màu thời trang','Nhuộm',850000,150,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000003','Uốn sóng tự nhiên','Uốn',950000,180,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000004','Gội đầu thư giãn','Chăm sóc',120000,40,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000005','Phục hồi chuyên sâu','Chăm sóc',450000,60,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.catalog_items(id,name,category,price,duration_minutes,active,is_demo,salon_id) values('d1100000-0000-4000-8000-000000000006','Duỗi tóc mềm mượt','Duỗi',800000,150,true,true,'a1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000001','MAU-001','Khách mẫu Linh','Cắt & tạo kiểu','2026-10-28T02:00:00Z','2026-10-28T02:45:00Z',150000,'completed',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000002','MAU-002','Khách mẫu Minh','Nhuộm màu thời trang','2026-10-28T02:30:00Z','2026-10-28T05:00:00Z',850000,'completed',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000002') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000003','MAU-003','Khách mẫu Thảo','Uốn sóng tự nhiên','2026-10-28T03:00:00Z','2026-10-28T06:00:00Z',950000,'completed',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000003') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000004','MAU-004','Khách mẫu An','Gội đầu thư giãn','2026-10-28T04:00:00Z','2026-10-28T04:40:00Z',120000,'completed',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000004') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000005','MAU-005','Khách mẫu Ngọc','Phục hồi chuyên sâu','2026-10-28T06:00:00Z',null,450000,'serving',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000005') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000006','MAU-006','Khách mẫu Huy','Cắt & tạo kiểu','2026-10-28T07:00:00Z',null,150000,'serving',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000006') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000007','MAU-007','Khách mẫu Linh','Duỗi tóc mềm mượt','2026-10-28T08:00:00Z',null,800000,'cancelled',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000001') on conflict(id) do nothing;
  insert into public.orders(id,code,customer_name,service_name,check_in,check_out,total,status,is_demo,salon_id,customer_id) values('e1100000-0000-4000-8000-000000000008','MAU-008','Khách mẫu An','Phục hồi chuyên sâu','2026-10-28T09:00:00Z','2026-10-28T10:00:00Z',450000,'completed',true,'a1100000-0000-4000-8000-000000000001','c1100000-0000-4000-8000-000000000004') on conflict(id) do nothing;
end $$;
