begin;

alter table public.catalog_items add column commission_rate numeric(5,2) not null default 0
  check (commission_rate between 0 and 100);
alter table public.orders add column commission_assignments jsonb not null default '{}';
create index appointments_commission_order_idx on public.appointments(salon_id,order_id) where order_id is not null;

create table public.commission_entries (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  payment_id uuid not null references public.payments(id),
  refund_id uuid references public.refunds(id),
  order_item_id uuid not null references public.order_items(id),
  stylist_id uuid not null references public.stylists(id),
  stylist_name text not null,
  service_name text not null,
  order_code text not null,
  rate numeric(5,2) not null,
  basis integer not null,
  amount integer not null,
  occurred_at timestamptz not null
);
create unique index commission_payment_line_idx on public.commission_entries(payment_id,order_item_id) where refund_id is null;
create unique index commission_refund_line_idx on public.commission_entries(refund_id,order_item_id) where refund_id is not null;
create index commission_period_idx on public.commission_entries(salon_id,occurred_at desc,id desc);
create index commission_refund_payment_idx on public.refunds(payment_id);
alter table public.commission_entries enable row level security;
revoke all on public.commission_entries from anon,authenticated;
grant select on public.commission_entries to authenticated;
create policy commission_owner_read on public.commission_entries for select to authenticated using(private.is_owner(salon_id));

create function public.set_commission_rate(p_catalog uuid,p_rate numeric)
returns void language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(true);
begin
  if p_rate is null or p_rate not between 0 and 100 or round(p_rate,2)<>p_rate then
    raise exception 'INVALID_COMMISSION_RATE';
  end if;
  update public.catalog_items set commission_rate=p_rate where id=p_catalog and salon_id=s and not is_demo;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;

-- Calls the existing payment RPC under the same order lock and transaction.
create function public.pay_order_with_commission(p_order uuid,p_revision integer,p_request uuid,p_method text,
  p_tendered integer,p_check_out timestamptz,p_assignments jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(); o public.orders;
begin
  select * into o from public.orders where id=p_order and salon_id=s and not is_demo for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if o.status='serving' then
    if jsonb_typeof(p_assignments) is distinct from 'object' then raise exception 'INVALID_STYLIST'; end if;
    if (select count(*) from jsonb_object_keys(p_assignments))>50 then raise exception 'INVALID_STYLIST'; end if;
    if exists (
      select 1 from jsonb_each_text(p_assignments) a
      left join public.order_items i on i.id::text=a.key and i.salon_id=s and i.order_id=p_order
      left join public.stylists st on st.id=case when a.value ~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then a.value::uuid end
        and st.salon_id=s and st.active
      where i.id is null or (a.value is not null and st.id is null)
    ) then raise exception 'INVALID_STYLIST'; end if;
    update public.orders set commission_assignments=p_assignments where id=p_order;
  end if;
  return public.pay_order(p_order,p_revision,p_request,p_method,p_tendered,p_check_out);
end $$;

create function private.capture_commission()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.amount=0 then return new; end if;
  with lines as (
    select i.*,sum(i.line_total) over(order by i.position,i.id rows unbounded preceding) as cumulative
    from public.order_items i
    where i.order_id=new.order_id and i.salon_id=new.salon_id
  ), allocated as (
    select i.*,o.code,o.commission_assignments,
      (round(i.cumulative::numeric*new.amount/o.subtotal)
       -round((i.cumulative-i.line_total)::numeric*new.amount/o.subtotal))::integer as net_basis
    from lines i join public.orders o on o.id=i.order_id and o.subtotal>0
  )
  insert into public.commission_entries(salon_id,payment_id,order_item_id,stylist_id,stylist_name,
    service_name,order_code,rate,basis,amount,occurred_at)
  select new.salon_id,new.id,i.id,st.id,st.name,concat_ws(' · ',i.name,nullif(i.variant,'')),
    i.code,c.commission_rate,i.net_basis,round(i.net_basis*c.commission_rate/100)::integer,new.paid_at
  from allocated i
  join public.catalog_items c on c.id=i.catalog_id and c.salon_id=i.salon_id and c.commission_rate>0
  left join lateral (
    select a.stylist_id from public.appointments a
    where a.salon_id=i.salon_id and a.order_id=i.order_id order by a.id limit 1
  ) a on not (i.commission_assignments ? i.id::text)
  join public.stylists st on st.salon_id=i.salon_id and st.id=case
    when i.commission_assignments ? i.id::text then (i.commission_assignments->>i.id::text)::uuid
    else a.stylist_id end
  where i.net_basis>0;
  return new;
end $$;

create function private.reverse_commission()
returns trigger language plpgsql security definer set search_path='' as $$
declare refunded bigint;
begin
  if not exists(select 1 from public.commission_entries where payment_id=new.payment_id and refund_id is null)
    then return new; end if;
  select sum(amount) into refunded from public.refunds where payment_id=new.payment_id;
  insert into public.commission_entries(salon_id,payment_id,refund_id,order_item_id,stylist_id,stylist_name,
    service_name,order_code,rate,basis,amount,occurred_at)
  select e.salon_id,e.payment_id,new.id,e.order_item_id,e.stylist_id,e.stylist_name,
    e.service_name,e.order_code,e.rate,e.basis,
    (round(e.amount::numeric*(refunded-new.amount)/p.amount)-round(e.amount::numeric*refunded/p.amount))::integer,new.created_at
  from public.commission_entries e join public.payments p on p.id=e.payment_id
  where e.payment_id=new.payment_id and e.salon_id=new.salon_id and e.refund_id is null;
  return new;
end $$;

create trigger capture_commission after insert on public.payments for each row execute function private.capture_commission();
create trigger reverse_commission after insert on public.refunds for each row execute function private.reverse_commission();

create function public.commission_report(p_start date,p_end date)
returns table(stylist_id uuid,stylist_name text,earned bigint,reversed bigint,net bigint)
language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(true);
begin
  if p_start is null or p_end is null or p_end-p_start not between 0 and 365
    or p_start<date '2000-01-01' or p_end>date '2200-12-31' then raise exception 'INVALID_PERIOD'; end if;
  return query select e.stylist_id,st.name,
    coalesce(sum(e.amount) filter(where e.refund_id is null),0),
    -coalesce(sum(e.amount) filter(where e.refund_id is not null),0),sum(e.amount)
  from public.commission_entries e join public.stylists st on st.id=e.stylist_id
  where e.salon_id=s and e.occurred_at>=p_start::timestamp at time zone 'Asia/Ho_Chi_Minh'
    and e.occurred_at<(p_end+1)::timestamp at time zone 'Asia/Ho_Chi_Minh'
  group by e.stylist_id,st.name order by 2,1;
end $$;

revoke all on function private.capture_commission(),private.reverse_commission() from public,anon,authenticated;
revoke all on function public.set_commission_rate(uuid,numeric),public.pay_order_with_commission(uuid,integer,uuid,text,integer,timestamptz,jsonb),
  public.commission_report(date,date) from public,anon;
grant execute on function public.set_commission_rate(uuid,numeric),public.pay_order_with_commission(uuid,integer,uuid,text,integer,timestamptz,jsonb),
  public.commission_report(date,date) to authenticated;
insert into public.app_migrations(version) values('1.5.0');
commit;
