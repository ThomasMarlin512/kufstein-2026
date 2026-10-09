-- Personal profile fields are private to their owner. Existing members and votes are preserved.
create table public.member_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check (char_length(full_name) between 2 and 100),
 email text not null default '' check (char_length(email) <= 254),
 updated_at timestamptz not null default now()
);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from public, anon, authenticated;
grant select on public.member_profiles to authenticated;
create policy "Members read their own profile" on public.member_profiles
 for select to authenticated
 using ((select auth.uid())=user_id and exists(select 1 from public.group_members m where m.user_id=(select auth.uid())));

create or replace function public.get_my_kufstein_profile()
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_profile jsonb;
begin
 if auth.uid() is null then raise exception 'Anmeldung erforderlich'; end if;
 select jsonb_build_object(
  'full_name',coalesce(p.full_name,''),
  'nickname',m.display_name,
  'email',coalesce(p.email,u.email,''),
  'login_email',coalesce(u.email,''),
  'login_email_confirmed',u.email_confirmed_at is not null
 ) into v_profile
 from public.group_members m
 left join public.member_profiles p on p.user_id=m.user_id
 left join auth.users u on u.id=m.user_id
 where m.user_id=auth.uid();
 if v_profile is null then raise exception 'Kein Gruppenzugang'; end if;
 return v_profile;
end;
$function$;
revoke all on function public.get_my_kufstein_profile() from public, anon;
grant execute on function public.get_my_kufstein_profile() to authenticated;

create or replace function public.save_kufstein_profile(p_full_name text,p_nickname text,p_email text)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_full text:=btrim(coalesce(p_full_name,'')); v_nick text:=btrim(coalesce(p_nickname,'')); v_email text:=btrim(coalesce(p_email,''));
begin
 if auth.uid() is null then raise exception 'Anmeldung erforderlich'; end if;
 if char_length(v_full) not between 2 and 100 then raise exception 'Vollständiger Name muss 2 bis 100 Zeichen haben'; end if;
 if char_length(v_nick) not between 2 and 50 then raise exception 'Nickname muss 2 bis 50 Zeichen haben'; end if;
 if char_length(v_email)>254 or (v_email<>'' and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'Bitte eine gültige E-Mail-Adresse eingeben'; end if;
 perform public.rename_kufstein_member(v_nick);
 insert into public.member_profiles(user_id,full_name,email,updated_at)
 values(auth.uid(),v_full,v_email,now())
 on conflict(user_id) do update set full_name=excluded.full_name,email=excluded.email,updated_at=excluded.updated_at;
 return public.get_my_kufstein_profile();
end;
$function$;
revoke all on function public.save_kufstein_profile(text,text,text) from public, anon;
grant execute on function public.save_kufstein_profile(text,text,text) to authenticated;

CREATE OR REPLACE FUNCTION public.recover_kufstein_member(p_code text, p_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_user uuid := auth.uid();
 v_name text := btrim(p_name);
 v_count integer := 0;
 v_old uuid;
 v_vote record;
begin
 if v_user is null then raise exception 'Anmeldung erforderlich'; end if;
 if char_length(v_name) not between 2 and 50 then raise exception 'Ungültiger Name'; end if;
 if not exists(select 1 from public.group_settings where id=1 and code_hash=md5(p_code)) then
   raise exception 'Ungültiger Gruppencode';
 end if;
 perform pg_advisory_xact_lock(hashtext(lower(v_name)));
 if exists(select 1 from public.group_members where user_id=v_user and lower(btrim(display_name))<>lower(v_name)) then
   raise exception 'Dieses Konto gehört bereits zu einem anderen Teilnehmer';
 end if;
 if not exists(select 1 from public.group_members where lower(btrim(display_name))=lower(v_name)) then
   raise exception 'Teilnehmer nicht gefunden';
 end if;
 for v_old in select user_id from public.group_members where lower(btrim(display_name))=lower(v_name) and user_id<>v_user order by joined_at,user_id loop
   for v_vote in select activity_id,choice,updated_at from public.votes where user_id=v_old loop
     insert into public.vote_recovery_archive(source_user_id,activity_id,choice,updated_at,recovered_to)
     values(v_old,v_vote.activity_id,v_vote.choice,v_vote.updated_at,v_user) on conflict do nothing;
     insert into public.votes(user_id,activity_id,choice,updated_at)
     values(v_user,v_vote.activity_id,v_vote.choice,v_vote.updated_at)
     on conflict(user_id,activity_id) do update set
       choice=case when excluded.updated_at>public.votes.updated_at then excluded.choice else public.votes.choice end,
       updated_at=greatest(public.votes.updated_at,excluded.updated_at);
     v_count:=v_count+1;
   end loop;
   -- Copy the private profile before moving the existing membership.
   insert into public.member_profiles(user_id,full_name,email,updated_at)
   select v_user,full_name,email,updated_at from public.member_profiles where user_id=v_old
   on conflict(user_id) do update set
    full_name=excluded.full_name,email=excluded.email,updated_at=excluded.updated_at
   where excluded.updated_at>public.member_profiles.updated_at;
   delete from public.votes where user_id=v_old;
   delete from public.group_members where user_id=v_old;
 end loop;
 insert into public.group_members(user_id,display_name) values(v_user,v_name)
 on conflict(user_id) do update set display_name=excluded.display_name;
 return v_count;
end; $function$
;
