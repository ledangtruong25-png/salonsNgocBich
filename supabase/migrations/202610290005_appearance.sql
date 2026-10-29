begin;
alter table public.salons add column appearance jsonb not null default '{"sidebar":"#285a45","sidebarEnd":"#17392b","background":"#f7f8f5","surface":"#ffffff","accent":"#285a45","gradient":false}'::jsonb;
-- Carry forward the previously saved accent instead of discarding the salon's choice.
update public.salons set appearance=appearance||jsonb_build_object('accent',theme_color,'sidebar',theme_color);
create function public.set_appearance(p_theme jsonb) returns void language plpgsql security definer set search_path='' as $$
declare s uuid:=private.current_salon(true); k text;
begin
 if jsonb_typeof(p_theme) is distinct from 'object' or jsonb_typeof(p_theme->'gradient') is distinct from 'boolean' then raise exception 'INVALID_THEME';end if;
 foreach k in array array['sidebar','sidebarEnd','background','surface','accent'] loop
 if jsonb_typeof(p_theme->k) is distinct from 'string' or (p_theme->>k) !~ '^#[0-9a-fA-F]{6}$' then raise exception 'INVALID_THEME';end if;
 end loop;
 if (select count(*) from jsonb_object_keys(p_theme))<>6 then raise exception 'INVALID_THEME';end if;
 update public.salons set appearance=p_theme,theme_color=p_theme->>'accent' where id=s;
 insert into public.audit_events(salon_id,actor,action,entity_id,detail) values(s,auth.uid(),'set_appearance',s,p_theme);
end $$;
revoke all on function public.set_appearance(jsonb) from public,anon;
grant execute on function public.set_appearance(jsonb) to authenticated;
insert into public.app_migrations(version) values('1.2.1');
commit;
