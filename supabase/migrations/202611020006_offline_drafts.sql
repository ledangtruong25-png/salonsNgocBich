begin;
create table public.draft_sync_operations(id uuid primary key,salon_id uuid not null references public.salons(id),actor uuid not null references public.profiles(id),order_id uuid not null unique references public.orders(id),created_at timestamptz not null default now());
alter table public.draft_sync_operations enable row level security;
revoke all on public.draft_sync_operations from anon,authenticated;
grant select on public.draft_sync_operations to authenticated;
create policy draft_sync_read on public.draft_sync_operations for select to authenticated using(actor=auth.uid() and private.is_member(salon_id));
create function public.sync_offline_draft(p_id uuid,p_actor uuid,p_salon uuid,p_name text,p_phone text,p_check_in timestamptz,p_items jsonb,p_note text,p_accept_prices boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon();op public.draft_sync_operations;c uuid;svc public.catalog_items;item jsonb;clean jsonb:='[]';normalized_phone text:=regexp_replace(coalesce(p_phone,''),'[\s().-]','','g');
begin
 if p_actor is distinct from auth.uid() or p_salon is distinct from s or p_id is null then raise exception 'ACCOUNT_MISMATCH';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,13));
 select * into op from public.draft_sync_operations where id=p_id;
 if found then if op.actor<>auth.uid() or op.salon_id<>s then raise exception 'FORBIDDEN';end if;return op.order_id;end if;
 if exists(select 1 from public.orders where id=p_id) then raise exception 'DRAFT_ID_CONFLICT';end if;
 if p_name is null or char_length(trim(p_name)) not between 2 and 100 or (normalized_phone<>'' and normalized_phone !~ '^\+?[0-9]{8,15}$') or p_note is null or char_length(p_note)>500 then raise exception 'INVALID_CUSTOMER';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'ITEMS_REQUIRED';end if;
 for item in select value from jsonb_array_elements(p_items) loop
  select * into svc from public.catalog_items where id=(item->>'catalog_id')::uuid and salon_id=s and active and not is_demo for share;
  if not found then raise exception 'SERVICE_UNAVAILABLE';end if;
  if not coalesce(p_accept_prices,false) and (item->>'expected_price')::integer is distinct from svc.price then raise exception 'PRICE_CHANGED';end if;
  clean:=clean||jsonb_build_array(jsonb_build_object('catalog_id',svc.id,'quantity',(item->>'quantity')::integer));
 end loop;
 -- Serialize phone matching to prevent concurrent customer creation races.
 perform pg_advisory_xact_lock(hashtextextended(s::text||normalized_phone,14));
 if normalized_phone<>'' then select id into c from public.customers where salon_id=s and phone=normalized_phone and not is_demo;end if;
 if c is null then c:=public.save_customer(null,p_name,normalized_phone);end if;
 perform public.save_order(p_id,0,c,p_check_in,null,clean,'fixed',0,p_note);
 insert into public.draft_sync_operations(id,salon_id,actor,order_id) values(p_id,s,auth.uid(),p_id);
 insert into public.audit_events(salon_id,actor,action,entity_id) values(s,auth.uid(),'sync_offline_draft',p_id);
 return p_id;
end $$;
revoke all on function public.sync_offline_draft(uuid,uuid,uuid,text,text,timestamptz,jsonb,text,boolean) from public,anon;
grant execute on function public.sync_offline_draft(uuid,uuid,uuid,text,text,timestamptz,jsonb,text,boolean) to authenticated;
insert into public.app_migrations(version) values('1.3.0');commit;
