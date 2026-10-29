-- v1.0.0 additive upgrade; apply AFTER 202610280001_foundation.sql.
-- Preserves v0.1.0 samples and memberships. Do not rerun on an upgraded project.
begin;
create table public.app_migrations(version text primary key, applied_at timestamptz not null default now());
insert into public.app_migrations(version) values ('1.0.0');
alter table public.app_migrations enable row level security;
revoke all on public.app_migrations from anon,authenticated;
alter table public.customers drop constraint customers_is_demo_check;
alter table public.catalog_items drop constraint catalog_items_is_demo_check;
alter table public.orders drop constraint orders_is_demo_check;
alter table public.customers alter column is_demo set default false;
alter table public.catalog_items alter column is_demo set default false;
alter table public.orders alter column is_demo set default false;
alter table public.customers alter column last_visit set default now();
alter table public.catalog_items add column variant text not null default '';
alter table public.orders add column customer_phone text not null default '';
alter table public.orders add column subtotal integer not null default 0 check(subtotal between 0 and 1000000000);
alter table public.orders add column discount_type text not null default 'fixed' check(discount_type in ('fixed','percent'));
alter table public.orders add column discount_value integer not null default 0 check(discount_value >= 0);
alter table public.orders add column discount_amount integer not null default 0 check(discount_amount >= 0);
alter table public.orders add column note text not null default '' check(char_length(note)<=500);
alter table public.orders add column revision integer not null default 1;
alter table public.orders add column paid_at timestamptz;
alter table public.orders add column created_by uuid references public.profiles(id);
alter table public.orders add column created_at timestamptz not null default now();
alter table public.orders add column receipt_salon jsonb;
alter table public.orders add column cancel_reason text;
create index orders_live_paid_idx on public.orders(salon_id,paid_at) where not is_demo and status='completed';
create index customers_live_search_idx on public.customers(salon_id,phone) where not is_demo;
create unique index customers_live_phone_unique on public.customers(salon_id,phone) where not is_demo and phone is not null and phone<>'';
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  salon_id uuid not null,
  catalog_id uuid not null,
  name text not null, variant text not null default '',
  quantity integer not null check(quantity between 1 and 99),
  unit_price integer not null check(unit_price between 0 and 100000000),
  line_total integer not null check(line_total between 0 and 1000000000),
  position integer not null,
  foreign key(order_id) references public.orders(id),
  foreign key(catalog_id,salon_id) references public.catalog_items(id,salon_id)
);
create index order_items_salon_order_idx on public.order_items(salon_id,order_id);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  order_id uuid not null unique references public.orders(id),
  request_id uuid not null unique,
  method text not null check(method in ('cash','transfer')),
  amount integer not null check(amount between 0 and 1000000000),
  tendered integer not null check(tendered between 0 and 1000000000 and tendered>=amount),
  change_amount integer not null check(change_amount=tendered-amount),
  paid_at timestamptz not null default now(),
  paid_by uuid not null references public.profiles(id)
);
create index payments_salon_paid_idx on public.payments(salon_id,paid_at);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), salon_id uuid not null references public.salons(id),
  actor uuid not null references public.profiles(id), action text not null,
  entity_id uuid not null, created_at timestamptz not null default now(), detail jsonb not null default '{}'
);
create index audit_salon_date_idx on public.audit_events(salon_id,created_at);
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.order_items,public.payments,public.audit_events from anon,authenticated;
grant select on public.order_items,public.payments,public.audit_events to authenticated;
create policy items_read on public.order_items for select to authenticated using(private.is_member(salon_id));
create policy payments_read on public.payments for select to authenticated using(private.is_member(salon_id));
create policy audit_read on public.audit_events for select to authenticated using(private.is_owner(salon_id));

-- All writes enter through RPCs. Identity/salon are derived from Auth, never trusted from the client.
create function private.current_salon(owner_only boolean default false) returns uuid
language plpgsql security definer set search_path='' as $$
declare m public.salon_members;
begin
 select * into m from public.salon_members where user_id=auth.uid() and active for share;
 if not found or (owner_only and m.role<>'owner') then raise exception 'FORBIDDEN'; end if;
 return m.salon_id;
end $$;
create function public.save_customer(p_id uuid,p_name text,p_phone text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); result uuid; normalized_phone text:=regexp_replace(coalesce(p_phone,''),'[\s().-]','','g');
begin
 if p_name is null or char_length(trim(p_name)) not between 2 and 100 or (normalized_phone<>'' and normalized_phone !~ '^\+?[0-9]{8,15}$') then raise exception 'INVALID_CUSTOMER'; end if;
 if p_id is null then
  insert into public.customers(salon_id,full_name,phone,is_demo) values(s,trim(p_name),nullif(normalized_phone,''),false) returning id into result;
 else
  update public.customers set full_name=trim(p_name),phone=nullif(normalized_phone,'') where id=p_id and salon_id=s and not is_demo returning id into result;
  if not found then raise exception 'NOT_FOUND'; end if;
 end if;
 return result;
end $$;
create function public.save_service(p_id uuid,p_name text,p_category text,p_variant text,p_price integer,p_duration integer,p_active boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(true); result uuid;
begin
 if p_name is null or char_length(trim(p_name)) not between 2 and 100 or p_category is null or char_length(trim(p_category)) not between 1 and 50 or p_variant is null or char_length(p_variant)>100 or p_price is null or p_price not between 0 and 100000000 or p_duration is null or p_duration not between 1 and 1440 or p_active is null then raise exception 'INVALID_SERVICE'; end if;
 if p_id is null then
  insert into public.catalog_items(salon_id,name,category,variant,price,duration_minutes,active,is_demo) values(s,trim(p_name),trim(p_category),trim(p_variant),p_price,p_duration,p_active,false) returning id into result;
 else
  update public.catalog_items set name=trim(p_name),category=trim(p_category),variant=trim(p_variant),price=p_price,duration_minutes=p_duration,active=p_active where id=p_id and salon_id=s and not is_demo returning id into result;
  if not found then raise exception 'NOT_FOUND'; end if;
 end if;
 insert into public.audit_events(salon_id,actor,action,entity_id) values(s,auth.uid(),'save_service',result);
 return result;
end $$;
-- p_id is a client-generated retry key. Revision is a compare-and-swap guard for multiple registers.
create function public.save_order(p_id uuid,p_revision integer,p_customer uuid,p_check_in timestamptz,p_check_out timestamptz,p_items jsonb,p_discount_type text,p_discount_value integer,p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); o public.orders; c public.customers; item jsonb; svc public.catalog_items;
 sub bigint:=0; disc bigint; pos integer:=0; qty integer; price integer; lines jsonb:='[]'; names text:='';
begin
 if p_id is null or p_revision is null then raise exception 'INVALID_ORDER'; end if;
 -- Serialize retries for the same id, including first creation.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into o from public.orders where id=p_id for update;
 if found then
  if o.salon_id<>s or o.is_demo then raise exception 'NOT_FOUND'; end if;
  if p_revision=0 then return p_id; end if; -- retry of creation does not create/update twice
  if o.status<>'serving' then raise exception 'ORDER_LOCKED'; end if;
  if o.revision<>p_revision then raise exception 'STALE_ORDER'; end if;
 elsif p_revision<>0 then raise exception 'NOT_FOUND'; end if;
 select * into c from public.customers where id=p_customer and salon_id=s and not is_demo for share;
 if not found then raise exception 'CUSTOMER_REQUIRED'; end if;
 if p_check_in is null or p_check_in>now()+interval '5 minutes' or (p_check_out is not null and (p_check_out<p_check_in or p_check_out>now()+interval '5 minutes')) then raise exception 'INVALID_TIME'; end if;
 if p_discount_type is null or p_discount_type not in ('fixed','percent') or p_discount_value is null or p_discount_value<0 or (p_discount_type='percent' and p_discount_value>100) or p_note is null or char_length(p_note)>500 then raise exception 'INVALID_DISCOUNT'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'ITEMS_REQUIRED'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  qty:=(item->>'quantity')::integer;
  if qty is null or qty not between 1 and 99 then raise exception 'INVALID_QUANTITY'; end if;
  select * into svc from public.catalog_items where id=(item->>'catalog_id')::uuid and salon_id=s and not is_demo and active for share;
  if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;
  -- Existing lines retain quoted price unless the service is newly added.
  select unit_price into price from public.order_items where order_id=p_id and catalog_id=svc.id order by position limit 1;
  price:=coalesce(price,svc.price);
  if price::bigint*qty>1000000000 then raise exception 'TOTAL_TOO_LARGE'; end if;
  sub:=sub+price::bigint*qty; pos:=pos+1;
  if sub>1000000000 then raise exception 'TOTAL_TOO_LARGE'; end if;
  lines:=lines||jsonb_build_array(jsonb_build_object('catalog_id',svc.id,'name',svc.name,'variant',svc.variant,'quantity',qty,'price',price,'position',pos));
  names:=concat_ws(', ',nullif(names,''),svc.name);
 end loop;
 if (select count(*) from jsonb_array_elements(lines))<>(select count(distinct value->>'catalog_id') from jsonb_array_elements(lines)) then raise exception 'DUPLICATE_SERVICE'; end if;
 disc:=case when p_discount_type='percent' then round(sub*p_discount_value/100.0) else p_discount_value end;
 if disc>sub then raise exception 'INVALID_DISCOUNT'; end if;
 if o.id is null then
  insert into public.orders(id,salon_id,customer_id,code,customer_name,customer_phone,service_name,check_in,check_out,subtotal,discount_type,discount_value,discount_amount,total,status,is_demo,note,created_by)
  values(p_id,s,c.id,'HD-'||upper(replace(p_id::text,'-','')),c.full_name,coalesce(c.phone,''),names,p_check_in,p_check_out,sub,p_discount_type,p_discount_value,disc,sub-disc,'serving',false,p_note,auth.uid());
 else
  update public.orders set customer_id=c.id,customer_name=c.full_name,customer_phone=coalesce(c.phone,''),service_name=names,check_in=p_check_in,check_out=p_check_out,subtotal=sub,discount_type=p_discount_type,discount_value=p_discount_value,discount_amount=disc,total=sub-disc,note=p_note,revision=revision+1 where id=p_id;
 end if;
 delete from public.order_items where order_id=p_id;
 insert into public.order_items(order_id,salon_id,catalog_id,name,variant,quantity,unit_price,line_total,position)
 select p_id,s,(value->>'catalog_id')::uuid,value->>'name',value->>'variant',(value->>'quantity')::int,(value->>'price')::int,(value->>'quantity')::int*(value->>'price')::int,(value->>'position')::int from jsonb_array_elements(lines);
 insert into public.audit_events(salon_id,actor,action,entity_id) values(s,auth.uid(),'save_order',p_id);
 return p_id;
end $$;
create function public.pay_order(p_order uuid,p_revision integer,p_request uuid,p_method text,p_tendered integer,p_check_out timestamptz) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); o public.orders; result uuid; existing public.payments; receipt jsonb; t timestamptz:=now();
begin
 select * into o from public.orders where id=p_order and salon_id=s and not is_demo for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 select * into existing from public.payments where order_id=p_order;
 if found then
  if existing.request_id=p_request then return existing.id; end if;
  raise exception 'ALREADY_PAID';
 end if;
 if o.status<>'serving' then raise exception 'ORDER_LOCKED'; end if;
 if p_revision is null or o.revision<>p_revision then raise exception 'STALE_ORDER'; end if;
 if p_request is null or p_method is null or p_method not in ('cash','transfer') or p_tendered is null or p_tendered<o.total or p_tendered>1000000000 or (p_method='transfer' and p_tendered<>o.total) then raise exception 'INVALID_PAYMENT'; end if;
 if p_check_out is null or p_check_out<o.check_in or p_check_out>t+interval '5 minutes' then raise exception 'INVALID_TIME'; end if;
 select jsonb_build_object('name',name,'phone',phone,'address',address) into receipt from public.salons where id=s;
 insert into public.payments(salon_id,order_id,request_id,method,amount,tendered,change_amount,paid_at,paid_by)
 values(s,p_order,p_request,p_method,o.total,p_tendered,p_tendered-o.total,t,auth.uid()) returning id into result;
 update public.orders set status='completed',paid_at=t,check_out=p_check_out,receipt_salon=receipt,revision=revision+1 where id=p_order;
 update public.customers set visits=visits+1,last_visit=case when visits=0 then p_check_out else greatest(last_visit,p_check_out) end where id=o.customer_id and salon_id=s;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'pay_order',p_order,jsonb_build_object('payment_id',result,'amount',o.total));
 return result;
end $$;
create function public.cancel_order(p_order uuid,p_revision integer,p_reason text) returns uuid
language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); o public.orders;
begin
 select * into o from public.orders where id=p_order and salon_id=s and not is_demo for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if o.status<>'serving' then raise exception 'ORDER_LOCKED'; end if;
 if p_revision is null or p_revision<>o.revision then raise exception 'STALE_ORDER'; end if;
 if p_reason is null or char_length(trim(p_reason)) not between 3 and 250 then raise exception 'REASON_REQUIRED'; end if;
 update public.orders set status='cancelled',cancel_reason=trim(p_reason),revision=revision+1 where id=p_order;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'cancel_order',p_order,jsonb_build_object('reason',trim(p_reason)));
 return p_order;
end $$;
-- Aggregate the entire period in Postgres, independent of list page sizes.
create function public.sales_report(p_period text,p_date date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s uuid; start_local timestamp; end_local timestamp; a timestamptz; b timestamptz; bucket text; result jsonb;
begin
 select salon_id into s from public.salon_members where user_id=auth.uid() and active;
 if s is null then raise exception 'FORBIDDEN'; end if;
 if p_period is null or p_period not in ('hour','day','week','month','year') or p_date is null or p_date not between date '2000-01-01' and date '2200-01-01' then raise exception 'INVALID_PERIOD'; end if;
 start_local:=case p_period when 'hour' then p_date::timestamp when 'day' then p_date::timestamp when 'week' then date_trunc('week',p_date::timestamp) when 'month' then date_trunc('month',p_date::timestamp) else date_trunc('year',p_date::timestamp) end;
 end_local:=start_local+case p_period when 'hour' then interval '1 day' when 'day' then interval '1 day' when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end;
 bucket:=case when p_period in ('hour','day') then 'hour' when p_period='year' then 'month' else 'day' end;
 a:=start_local at time zone 'Asia/Ho_Chi_Minh'; b:=end_local at time zone 'Asia/Ho_Chi_Minh';
 with paid as (select o.*,p.method,p.amount from public.orders o join public.payments p on p.order_id=o.id where o.salon_id=s and not o.is_demo and o.status='completed' and o.paid_at>=a and o.paid_at<b),
 buckets as (select x as time from generate_series(start_local,end_local-('1 '||bucket)::interval,('1 '||bucket)::interval) x),
 series as (select x.time,coalesce(sum(p.amount),0) revenue,count(p.id) orders from buckets x left join paid p on date_trunc(bucket,p.paid_at at time zone 'Asia/Ho_Chi_Minh')=x.time group by x.time order by x.time)
 select jsonb_build_object('start',a,'end',b,'period',p_period,'revenue',coalesce((select sum(amount) from paid),0),'orders',(select count(*) from paid),'discount',coalesce((select sum(discount_amount) from paid),0),'cash',coalesce((select sum(amount) from paid where method='cash'),0),'transfer',coalesce((select sum(amount) from paid where method='transfer'),0),'series',(select coalesce(jsonb_agg(jsonb_build_object('time',time,'revenue',revenue,'orders',orders) order by time),'[]') from series),'services',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select i.name,i.variant,sum(i.quantity) quantity,sum(i.line_total) gross from public.order_items i join paid p on p.id=i.order_id group by i.name,i.variant order by sum(i.line_total) desc) t)) into result;
 return result;
end $$;
revoke all on function private.current_salon(boolean) from public,anon,authenticated;
revoke all on function public.save_customer(uuid,text,text),public.save_service(uuid,text,text,text,integer,integer,boolean),public.save_order(uuid,integer,uuid,timestamptz,timestamptz,jsonb,text,integer,text),public.pay_order(uuid,integer,uuid,text,integer,timestamptz),public.cancel_order(uuid,integer,text),public.sales_report(text,date) from public,anon;
grant execute on function public.save_customer(uuid,text,text),public.save_service(uuid,text,text,text,integer,integer,boolean),public.save_order(uuid,integer,uuid,timestamptz,timestamptz,jsonb,text,integer,text),public.pay_order(uuid,integer,uuid,text,integer,timestamptz),public.cancel_order(uuid,integer,text),public.sales_report(text,date) to authenticated;
comment on table public.orders is 'v1.0.0 live orders via RPC; is_demo rows retained for reference and excluded from live app/reports.';
commit;
