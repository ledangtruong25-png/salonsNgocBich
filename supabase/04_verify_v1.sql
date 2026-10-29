-- Read-only installation check. Run as project administrator in SQL Editor.
select * from public.app_migrations order by applied_at;
select s.id,s.name,s.timezone,
 (select count(*) from public.orders o where o.salon_id=s.id and not o.is_demo) live_orders,
 (select count(*) from public.orders o where o.salon_id=s.id and o.is_demo) preserved_sample_orders,
 (select count(*) from public.catalog_items c where c.salon_id=s.id and not c.is_demo) live_services,
 (select count(*) from public.payments p where p.salon_id=s.id) payments
from public.salons s;
select tablename,rowsecurity from pg_tables where schemaname='public' order by tablename;
select m.salon_id,p.full_name,m.role,m.active from public.salon_members m join public.profiles p on p.id=m.user_id;
-- Must return zero rows: each completed live order has one matching payment.
select o.id,o.code,o.total,p.amount from public.orders o left join public.payments p on p.order_id=o.id
where not o.is_demo and ((o.status='completed' and (p.id is null or p.amount<>o.total)) or (o.status<>'completed' and p.id is not null));
