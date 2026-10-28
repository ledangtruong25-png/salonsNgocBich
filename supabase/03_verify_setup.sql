-- Run as project administrator in SQL Editor after bootstrap/add staff.
-- This checks installation, not whether a user session can log in.
select s.name,s.timezone,
  (select count(*) from public.customers c where c.salon_id=s.id) as sample_customers,
  (select count(*) from public.catalog_items c where c.salon_id=s.id) as sample_services,
  (select count(*) from public.orders o where o.salon_id=s.id) as sample_orders,
  (select coalesce(sum(o.total),0) from public.orders o where o.salon_id=s.id and o.status='completed') as completed_sample_value
from public.salons s;

select p.full_name,m.role,m.active from public.salon_members m
join public.profiles p on p.id=m.user_id order by m.role,p.full_name;

select tablename,rowsecurity from pg_tables
where schemaname='public' and tablename in('salons','profiles','salon_members','customers','catalog_items','orders')
order by tablename;
