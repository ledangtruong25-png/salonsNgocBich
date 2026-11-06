begin;

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  name text not null check (char_length(trim(name)) between 1 and 100),
  unit text not null check (unit in ('ml','g','chai','cái','hộp')),
  stock numeric(18,3) not null default 0,
  minimum numeric(15,3) not null check (minimum >= 0),
  unique (id,salon_id)
);
create unique index materials_salon_name_idx on public.materials(salon_id,lower(name));
create index materials_list_idx on public.materials(salon_id,name,id);
create index inventory_catalog_list_idx on public.catalog_items(salon_id,name,id) where active and not is_demo;

create table public.service_materials (
  salon_id uuid not null,
  catalog_id uuid not null,
  material_id uuid not null,
  quantity numeric(15,3) not null check (quantity > 0),
  primary key (salon_id,catalog_id,material_id),
  foreign key (catalog_id,salon_id) references public.catalog_items(id,salon_id),
  foreign key (material_id,salon_id) references public.materials(id,salon_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null,
  material_id uuid not null,
  payment_id uuid references public.payments(id),
  kind text not null check (kind in ('receipt','count','sale')),
  delta numeric(18,3) not null,
  balance numeric(18,3) not null,
  entered_quantity numeric(15,3),
  note text not null default '',
  actor uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  foreign key (material_id,salon_id) references public.materials(id,salon_id),
  unique (payment_id,material_id)
);
create index stock_movements_list_idx on public.stock_movements(salon_id,created_at desc,id desc);

alter table public.materials enable row level security;
alter table public.service_materials enable row level security;
alter table public.stock_movements enable row level security;
revoke all on public.materials,public.service_materials,public.stock_movements from anon,authenticated;
grant select on public.materials,public.service_materials,public.stock_movements to authenticated;
create policy materials_read on public.materials for select to authenticated using(private.is_owner(salon_id));
create policy service_materials_read on public.service_materials for select to authenticated using(private.is_owner(salon_id));
create policy stock_movements_read on public.stock_movements for select to authenticated using(private.is_owner(salon_id));

create function public.save_material(p_id uuid,p_name text,p_unit text,p_minimum numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(true); result uuid;
begin
  if p_id is null then
    insert into public.materials(salon_id,name,unit,minimum)
      values(s,trim(p_name),p_unit,p_minimum) returning id into result;
  else
    update public.materials set name=trim(p_name),minimum=p_minimum
      where id=p_id and salon_id=s returning id into result;
    if not found then raise exception 'NOT_FOUND'; end if;
  end if;
  return result;
end $$;

create function public.set_service_material(p_catalog uuid,p_material uuid,p_quantity numeric)
returns void language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(true);
begin
  if p_quantity is null or p_quantity < 0 or p_quantity > 999999999999 or round(p_quantity,3)<>p_quantity then raise exception 'INVALID_QUANTITY'; end if;
  if not exists(select 1 from public.catalog_items where id=p_catalog and salon_id=s and not is_demo)
    or not exists(select 1 from public.materials where id=p_material and salon_id=s)
    then raise exception 'NOT_FOUND'; end if;
  if p_quantity=0 then
    delete from public.service_materials where salon_id=s and catalog_id=p_catalog and material_id=p_material;
  else
    insert into public.service_materials(salon_id,catalog_id,material_id,quantity)
      values(s,p_catalog,p_material,p_quantity)
      on conflict(salon_id,catalog_id,material_id) do update set quantity=excluded.quantity;
  end if;
end $$;

create function public.record_stock(p_request uuid,p_material uuid,p_kind text,p_quantity numeric,p_note text,p_expected numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid := private.current_salon(true);
  previous public.stock_movements;
  current_stock numeric;
  new_stock numeric;
begin
  if p_request is null or p_kind is null or p_kind not in ('receipt','count') or p_quantity is null
    or p_quantity < 0 or p_quantity > 999999999999 or round(p_quantity,3)<>p_quantity
    or (p_kind='receipt' and p_quantity=0) or coalesce(char_length(trim(p_note)),0) not between 1 and 250
    then raise exception 'INVALID_STOCK'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text,140));
  select * into previous from public.stock_movements where id=p_request;
  if found then
    if previous.salon_id=s and previous.material_id=p_material and previous.kind=p_kind
      and previous.entered_quantity=p_quantity and previous.note=trim(p_note) then return p_request; end if;
    raise exception 'REQUEST_CONFLICT';
  end if;
  select stock into current_stock from public.materials where id=p_material and salon_id=s for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_kind='count' and p_expected is distinct from current_stock then raise exception 'STALE_STOCK'; end if;
  new_stock := case when p_kind='count' then p_quantity else current_stock+p_quantity end;
  update public.materials set stock=new_stock where id=p_material and salon_id=s;
  insert into public.stock_movements(id,salon_id,material_id,kind,delta,balance,entered_quantity,note,actor)
    values(p_request,s,p_material,p_kind,new_stock-current_stock,new_stock,p_quantity,trim(p_note),auth.uid());
  return p_request;
end $$;

create function private.consume_payment_stock()
returns trigger language plpgsql security definer set search_path='' as $$
declare item record; remaining numeric;
begin
  -- Aggregate once per material and acquire row locks in a consistent order.
  for item in
    select r.material_id, sum(i.quantity*r.quantity) as used
    from public.order_items i
    join public.service_materials r on r.salon_id=i.salon_id and r.catalog_id=i.catalog_id
    where i.salon_id=new.salon_id and i.order_id=new.order_id
    group by r.material_id order by r.material_id
  loop
    update public.materials set stock=stock-item.used where id=item.material_id and salon_id=new.salon_id
      returning stock into remaining;
    insert into public.stock_movements(salon_id,material_id,payment_id,kind,delta,balance,actor)
      values(new.salon_id,item.material_id,new.id,'sale',-item.used,remaining,new.paid_by);
  end loop;
  return new;
end $$;

create trigger consume_payment_stock after insert on public.payments
for each row execute function private.consume_payment_stock();

revoke all on function private.consume_payment_stock() from public,anon,authenticated;
revoke all on function public.save_material(uuid,text,text,numeric),
  public.set_service_material(uuid,uuid,numeric),
  public.record_stock(uuid,uuid,text,numeric,text,numeric) from public,anon;
grant execute on function public.save_material(uuid,text,text,numeric),
  public.set_service_material(uuid,uuid,numeric),
  public.record_stock(uuid,uuid,text,numeric,text,numeric) to authenticated;

insert into public.app_migrations(version) values ('1.4.0');
commit;
