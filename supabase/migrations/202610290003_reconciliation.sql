begin;
create table public.cash_sessions(id uuid primary key, salon_id uuid not null references public.salons(id), cashier uuid not null references public.profiles(id), opened_at timestamptz not null default now(), opening bigint not null check(opening between 0 and 1000000000), closed_at timestamptz, counted bigint check(counted>=0), expected bigint, difference bigint, note text not null default '', check(char_length(note)<=500));
create unique index one_open_session on public.cash_sessions(salon_id,cashier) where closed_at is null;
alter table public.payments add column session_id uuid references public.cash_sessions(id);
create table public.refunds(id uuid primary key, salon_id uuid not null references public.salons(id), payment_id uuid not null references public.payments(id), session_id uuid not null references public.cash_sessions(id), amount integer not null check(amount>0), reason text not null check(char_length(trim(reason)) between 3 and 250), actor uuid not null references public.profiles(id), created_at timestamptz not null default now());
alter table public.cash_sessions enable row level security;
alter table public.refunds enable row level security;
revoke all on public.cash_sessions,public.refunds from anon,authenticated;
grant select on public.cash_sessions,public.refunds to authenticated;
create policy session_read on public.cash_sessions for select to authenticated using(private.is_owner(salon_id) or (private.is_member(salon_id) and cashier=auth.uid()));
create policy refunds_read on public.refunds for select to authenticated using(private.is_member(salon_id));
create function public.open_session(p_id uuid,p_opening bigint) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); r public.cash_sessions;
begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 select * into r from public.cash_sessions where id=p_id;
 if found then if r.salon_id<>s or r.cashier<>auth.uid() then raise exception 'FORBIDDEN'; end if;return r.id;end if;
 insert into public.cash_sessions(id,salon_id,cashier,opening) values(p_id,s,auth.uid(),p_opening);
 insert into public.audit_events(salon_id,actor,action,entity_id) values(s,auth.uid(),'open_session',p_id);return p_id;
end $$;
-- Trigger makes the existing payment RPC require and lock an active session.
create function private.attach_session() returns trigger language plpgsql security definer set search_path='' as $$
begin
 select id into new.session_id from public.cash_sessions where salon_id=new.salon_id and cashier=new.paid_by and closed_at is null for update;
 if new.session_id is null then raise exception 'OPEN_SESSION_REQUIRED';end if;return new;
end $$;
create trigger payment_session before insert on public.payments for each row execute function private.attach_session();
create function public.refund_payment(p_id uuid,p_payment uuid,p_amount integer,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(true); pay public.payments; existing public.refunds; session uuid;
begin
 select * into pay from public.payments where id=p_payment and salon_id=s for update;
 if not found then raise exception 'NOT_FOUND';end if;
 select * into existing from public.refunds where id=p_id;
 if found then if existing.payment_id<>p_payment or existing.amount<>p_amount or existing.reason<>p_reason then raise exception 'RETRY_MISMATCH';end if;return p_id;end if;
 select id into session from public.cash_sessions where salon_id=s and cashier=auth.uid() and closed_at is null for update;
 if session is null then raise exception 'OPEN_SESSION_REQUIRED';end if;
 if p_amount is null or p_amount<=0 or p_amount>pay.amount-coalesce((select sum(amount) from public.refunds where payment_id=pay.id),0) then raise exception 'REFUND_EXCEEDS_PAYMENT';end if;
 insert into public.refunds(id,salon_id,payment_id,session_id,amount,reason,actor) values(p_id,s,p_payment,session,p_amount,p_reason,auth.uid());
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'refund_payment',p_id,jsonb_build_object('payment_id',p_payment,'amount',p_amount,'reason',p_reason));return p_id;
end $$;
create function public.close_session(p_id uuid,p_counted bigint,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(); r public.cash_sessions; total bigint;
begin
 select * into r from public.cash_sessions where id=p_id and salon_id=s and cashier=auth.uid() for update;
 if not found then raise exception 'FORBIDDEN';end if;
 if r.closed_at is not null then return p_id;end if;
 total:=r.opening+coalesce((select sum(amount) from public.payments where session_id=p_id and method='cash'),0)-coalesce((select sum(f.amount) from public.refunds f join public.payments p on p.id=f.payment_id where f.session_id=p_id and p.method='cash'),0);
 if p_counted is null or p_counted<0 or p_counted>1000000000000 or p_note is null or char_length(p_note)>500 or (p_counted<>total and char_length(trim(p_note))<3) then raise exception 'COUNT_OR_NOTE_REQUIRED';end if;
 update public.cash_sessions set closed_at=now(),counted=p_counted,expected=total,difference=p_counted-total,note=p_note where id=p_id;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'close_session',p_id,jsonb_build_object('expected',total,'counted',p_counted,'difference',p_counted-total));return p_id;
end $$;
create function public.net_report(p_start date,p_end date) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s uuid; a timestamptz; b timestamptz; gross bigint; refunds bigint;
begin
 select salon_id into s from public.salon_members where user_id=auth.uid() and active;
 if s is null then raise exception 'FORBIDDEN';end if;
 if p_start is null or p_end is null or p_end<p_start or p_end-p_start>366 then raise exception 'INVALID_PERIOD';end if;
 a:=p_start::timestamp at time zone 'Asia/Ho_Chi_Minh';b:=(p_end+1)::timestamp at time zone 'Asia/Ho_Chi_Minh';
 select coalesce(sum(amount),0) into gross from public.payments where salon_id=s and paid_at>=a and paid_at<b;
 select coalesce(sum(amount),0) into refunds from public.refunds where salon_id=s and created_at>=a and created_at<b;
 return jsonb_build_object('gross',gross,'refunds',refunds,'net',gross-refunds);
end $$;
revoke all on function public.open_session(uuid,bigint),public.close_session(uuid,bigint,text),public.refund_payment(uuid,uuid,integer,text),public.net_report(date,date),private.attach_session() from public,anon;
grant execute on function public.open_session(uuid,bigint),public.close_session(uuid,bigint,text),public.refund_payment(uuid,uuid,integer,text),public.net_report(date,date) to authenticated;
insert into public.app_migrations(version) values('1.1.0');
commit;
