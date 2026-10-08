-- Kufstein 2026 V3.3: SQL Editor (einmalig)
-- VOR dem Start einen zufälligen, langen Gruppencode wählen und NUR im Supabase SQL Editor setzen.
create table if not exists public.group_settings (
  id integer primary key check (id = 1),
  code_hash text not null
);
alter table public.group_settings enable row level security;
revoke all on public.group_settings from anon, authenticated;
-- WICHTIG: Folgende Zeile NUR IM SQL EDITOR ergänzen/ausführen, NICHT ins öffentliche GitHub schreiben:
-- insert into public.group_settings(id,code_hash) values (1,md5('DEIN_LANGER_ZUFAELLIGER_CODE')) on conflict(id) do update set code_hash=excluded.code_hash;

create table if not exists public.group_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 50),
  joined_at timestamptz not null default now()
);
alter table public.group_members enable row level security;
revoke all on public.group_members from anon;
grant select on public.group_members to authenticated;

create or replace function public.is_group_member()
returns boolean language sql stable security definer set search_path = ''
as $$select exists(select 1 from public.group_members where user_id=auth.uid())$$;
revoke all on function public.is_group_member() from public;
grant execute on function public.is_group_member() to authenticated;

create or replace function public.join_kufstein_group(p_code text,p_name text)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Anmeldung erforderlich'; end if;
  if char_length(trim(p_name)) not between 2 and 50 then raise exception 'Name muss 2 bis 50 Zeichen enthalten'; end if;
  if not exists(select 1 from public.group_settings where id=1 and code_hash=md5(p_code)) then
    raise exception 'Ungültiger Gruppencode';
  end if;
  insert into public.group_members(user_id,display_name) values(auth.uid(),trim(p_name))
  on conflict(user_id) do update set display_name=excluded.display_name;
  return true;
end;$$;
revoke all on function public.join_kufstein_group(text,text) from public;
grant execute on function public.join_kufstein_group(text,text) to authenticated;

drop policy if exists "Read aggregate votes" on public.votes;
drop policy if exists "Create own vote" on public.votes;
drop policy if exists "Update own vote" on public.votes;
drop policy if exists "Delete own vote" on public.votes;
create policy "Members read votes" on public.votes for select to authenticated using (public.is_group_member());
create policy "Members insert own vote" on public.votes for insert to authenticated with check (auth.uid()=user_id and public.is_group_member());
create policy "Members update own vote" on public.votes for update to authenticated using (auth.uid()=user_id and public.is_group_member()) with check (auth.uid()=user_id and public.is_group_member());
create policy "Members delete own vote" on public.votes for delete to authenticated using (auth.uid()=user_id and public.is_group_member());
create policy "Members see members" on public.group_members for select to authenticated using (public.is_group_member());
-- Kein direkter Schreibzugriff auf group_members: Beitritt nur über die geprüfte RPC-Funktion.
-- Für eine kleine vertraute Gruppe geeignet. Geteilter Code kann weitergegeben werden; keine strenge Identitätsprüfung.
