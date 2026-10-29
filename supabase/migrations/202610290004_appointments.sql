begin;
alter table public.salons add column theme_color text not null default '#285a45' check(theme_color ~ '^#[0-9a-fA-F]{6}$');
create table public.stylists(id uuid primary key default gen_random_uuid(),salon_id uuid not null references public.salons(id),name text not null check(char_length(trim(name)) between 2 and 100),active boolean not null default true);
create table public.appointments(id uuid primary key,salon_id uuid not null references public.salons(id),customer_id uuid not null references public.customers(id),stylist_id uuid not null references public.stylists(id),starts_at timestamptz not null,ends_at timestamptz not null,status text not null default 'booked' check(status in ('booked','confirmed','arrived','completed','cancelled','no_show')),items jsonb not null,override_reason text not null default '',note text not null default '',revision integer not null default 1,order_id uuid unique references public.orders(id),check(ends_at>starts_at),check(char_length(note)<=500));
create index appointments_time on public.appointments(salon_id,stylist_id,starts_at,ends_at);
alter table public.stylists enable row level security;alter table public.appointments enable row level security;
revoke all on public.stylists,public.appointments from anon,authenticated;
grant select on public.stylists,public.appointments to authenticated;
create policy stylists_read on public.stylists for select to authenticated using(private.is_member(salon_id));
create policy appointments_read on public.appointments for select to authenticated using(private.is_member(salon_id));
create function public.save_stylist(p_name text,p_id uuid default null,p_active boolean default true) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(true);r uuid;
begin
 if p_id is null then insert into public.stylists(salon_id,name,active) values(s,p_name,p_active) returning id into r;else update public.stylists set name=p_name,active=p_active where id=p_id and salon_id=s returning id into r;end if;
 if r is null then raise exception 'NOT_FOUND';end if;return r;
end $$;
create function public.set_theme(p_color text) returns void language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(true);
begin update public.salons set theme_color=p_color where id=s;end $$;
create function public.save_appointment(p_id uuid,p_revision integer,p_customer uuid,p_stylist uuid,p_start timestamptz,p_end timestamptz,p_items jsonb,p_override boolean,p_reason text,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon();old public.appointments;item jsonb;
begin
 -- Salon-wide lock also serializes moving appointments between stylists.
 perform pg_advisory_xact_lock(hashtextextended(s::text,12));
 select * into old from public.appointments where id=p_id for update;
 if found then
 if old.salon_id<>s then raise exception 'FORBIDDEN';end if;
 if p_revision=0 then return p_id;end if;
 if old.revision<>p_revision or old.order_id is not null or old.status in ('completed','cancelled','no_show') then raise exception 'STALE_OR_LOCKED';end if;
 elsif p_revision<>0 then raise exception 'NOT_FOUND';end if;
 if not exists(select 1 from public.customers where id=p_customer and salon_id=s and not is_demo) or not exists(select 1 from public.stylists where id=p_stylist and salon_id=s and active) then raise exception 'INVALID_CUSTOMER_OR_STYLIST';end if;
 if p_start is null or p_end is null or p_end<=p_start or p_end-p_start>interval '24 hours' or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'INVALID_TIME_OR_ITEMS';end if;
 for item in select value from jsonb_array_elements(p_items) loop
 if not exists(select 1 from public.catalog_items where id=(item->>'catalog_id')::uuid and salon_id=s and active and not is_demo) or (item->>'quantity')::int is distinct from 1 then raise exception 'INVALID_SERVICE';end if;
 end loop;
 if exists(select 1 from public.appointments where salon_id=s and stylist_id=p_stylist and id<>p_id and status not in ('cancelled','no_show','completed') and starts_at<p_end and ends_at>p_start) then
 if not coalesce(p_override,false) or char_length(trim(coalesce(p_reason,'')))<3 then raise exception 'SCHEDULE_CONFLICT';end if;
 end if;
 insert into public.appointments(id,salon_id,customer_id,stylist_id,starts_at,ends_at,items,override_reason,note) values(p_id,s,p_customer,p_stylist,p_start,p_end,p_items,case when p_override then p_reason else '' end,p_note)
 on conflict(id) do update set customer_id=excluded.customer_id,stylist_id=excluded.stylist_id,starts_at=excluded.starts_at,ends_at=excluded.ends_at,items=excluded.items,override_reason=excluded.override_reason,note=excluded.note,revision=public.appointments.revision+1;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'save_appointment',p_id,jsonb_build_object('override',p_override,'reason',p_reason));return p_id;
end $$;
create function public.appointment_status(p_id uuid,p_revision integer,p_status text) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon();a public.appointments;o uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(s::text,12));
 select * into a from public.appointments where id=p_id and salon_id=s for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if p_status='arrived' and a.order_id is not null then return a.order_id;end if;
 if a.revision<>p_revision or a.status in ('cancelled','completed','no_show') then raise exception 'STALE_OR_LOCKED';end if;
 if p_status='arrived' then
 o:=gen_random_uuid();perform public.save_order(o,0,a.customer_id,now(),null,a.items,'fixed',0,a.note);
 update public.appointments set order_id=o,status='arrived',revision=revision+1 where id=p_id;
 else
 if p_status not in ('confirmed','cancelled','no_show','completed') or (a.order_id is not null and p_status<>'completed') then raise exception 'INVALID_STATUS';end if;
 if p_status='completed' and not exists(select 1 from public.orders where id=a.order_id and status='completed') then raise exception 'ORDER_NOT_PAID';end if;
 update public.appointments set status=p_status,revision=revision+1 where id=p_id;o:=p_id;
 end if;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'appointment_status',p_id,jsonb_build_object('status',p_status));return o;
end $$;
revoke all on function public.save_stylist(text,uuid,boolean),public.set_theme(text),public.save_appointment(uuid,integer,uuid,uuid,timestamptz,timestamptz,jsonb,boolean,text,text),public.appointment_status(uuid,integer,text) from public,anon;
grant execute on function public.save_stylist(text,uuid,boolean),public.set_theme(text),public.save_appointment(uuid,integer,uuid,uuid,timestamptz,timestamptz,jsonb,boolean,text,text),public.appointment_status(uuid,integer,text) to authenticated;
insert into public.app_migrations(version) values('1.2.0');commit;
