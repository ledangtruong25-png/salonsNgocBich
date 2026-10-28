-- Salon Manager v0.1.0. Run once in Supabase SQL Editor as project administrator.
-- No real sales or payment writes are available in this foundation release.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  phone text not null default '' check (char_length(phone) <= 24),
  address text not null default '' check (char_length(address) <= 250),
  timezone text not null default 'Asia/Ho_Chi_Minh' check (timezone = 'Asia/Ho_Chi_Minh'),
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 100)
);
create table public.salon_members (
  salon_id uuid not null references public.salons(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','cashier')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (salon_id,user_id),
  unique(user_id) -- v0.1.0 supports one salon per account.
);
create index salon_members_active_idx on public.salon_members(salon_id,active);

create function private.is_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.salon_members m
    where m.salon_id = target and m.user_id = (select auth.uid()) and m.active);
$$;
create function private.is_owner(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.salon_members m
    where m.salon_id = target and m.user_id = (select auth.uid()) and m.active and m.role = 'owner');
$$;
create function private.can_view_profile(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select target = (select auth.uid()) or exists(
    select 1 from public.salon_members mine join public.salon_members other on mine.salon_id = other.salon_id
    where mine.user_id = (select auth.uid()) and mine.active and mine.role = 'owner' and other.user_id = target
  );
$$;
revoke all on function private.is_member(uuid), private.is_owner(uuid), private.can_view_profile(uuid) from public, anon;
grant execute on function private.is_member(uuid), private.is_owner(uuid), private.can_view_profile(uuid) to authenticated;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  full_name text not null,
  phone text,
  visits integer not null default 0 check(visits >= 0),
  last_visit timestamptz not null,
  is_demo boolean not null default true check(is_demo),
  unique(id,salon_id)
);
create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  name text not null,
  category text not null,
  price integer not null check(price >= 0),
  duration_minutes integer not null check(duration_minutes > 0),
  active boolean not null default true,
  is_demo boolean not null default true check(is_demo),
  unique(id,salon_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id),
  customer_id uuid,
  code text not null,
  customer_name text not null,
  service_name text not null,
  check_in timestamptz not null,
  check_out timestamptz,
  total integer not null check(total >= 0),
  status text not null check(status in ('completed','serving','cancelled')),
  is_demo boolean not null default true check(is_demo),
  check(check_out is null or check_out >= check_in),
  foreign key(customer_id,salon_id) references public.customers(id,salon_id),
  unique(salon_id,code)
);
create index customers_salon_idx on public.customers(salon_id);
create index catalog_salon_idx on public.catalog_items(salon_id);
create index orders_salon_date_idx on public.orders(salon_id,check_in desc);

alter table public.salons enable row level security;
alter table public.profiles enable row level security;
alter table public.salon_members enable row level security;
alter table public.customers enable row level security;
alter table public.catalog_items enable row level security;
alter table public.orders enable row level security;

-- Revoke Supabase default grants, then allow only this release's operations.
revoke all on public.salons, public.profiles, public.salon_members, public.customers, public.catalog_items, public.orders from anon, authenticated;
grant select on public.salons, public.profiles, public.salon_members, public.customers, public.catalog_items, public.orders to authenticated;
grant update(name,phone,address) on public.salons to authenticated;

create policy salons_read on public.salons for select to authenticated using(private.is_member(id));
create policy salons_owner_update on public.salons for update to authenticated using(private.is_owner(id)) with check(private.is_owner(id));
create policy profiles_read on public.profiles for select to authenticated using(private.can_view_profile(id));
create policy members_read on public.salon_members for select to authenticated
  using(private.is_owner(salon_id) or (user_id = (select auth.uid()) and active));
create policy customers_read on public.customers for select to authenticated using(private.is_member(salon_id));
create policy catalog_read on public.catalog_items for select to authenticated using(private.is_member(salon_id));
create policy orders_read on public.orders for select to authenticated using(private.is_member(salon_id));
comment on table public.orders is 'v0.1.0 read-only sample orders; not a payment ledger. Replace/extend by migration for v1.0.0.';
commit;
