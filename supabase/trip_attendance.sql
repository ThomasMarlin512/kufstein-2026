create table public.trip_attendance (
 user_id uuid primary key references public.group_members(user_id) on delete cascade,
 status text not null default 'yes' check (status in ('yes','maybe','no'))
);
alter table public.trip_attendance enable row level security;
grant select,insert,update on public.trip_attendance to authenticated;
revoke all on public.trip_attendance from anon;
create policy "Group members read attendance" on public.trip_attendance for select to authenticated using (public.is_group_member());
create policy "Members insert their own attendance" on public.trip_attendance for insert to authenticated with check ((select auth.uid())=user_id and public.is_group_member());
create policy "Members update their own attendance" on public.trip_attendance for update to authenticated using ((select auth.uid())=user_id and public.is_group_member()) with check ((select auth.uid())=user_id and public.is_group_member());
insert into public.trip_attendance(user_id,status) select user_id,'yes' from public.group_members on conflict(user_id) do nothing;

begin;
alter table public.trip_attendance drop constraint trip_attendance_user_id_fkey;
alter table public.trip_attendance add column roster_key text;
alter table public.trip_attendance add column nickname text;
update public.trip_attendance a set roster_key=a.user_id::text,nickname=m.display_name from public.group_members m where m.user_id=a.user_id;
alter table public.trip_attendance alter column roster_key set not null;
alter table public.trip_attendance alter column nickname set not null;
create unique index trip_attendance_roster_key_unique on public.trip_attendance(roster_key);
create unique index trip_attendance_nickname_unique on public.trip_attendance(lower(btrim(nickname)));
create function public.sync_trip_attendance_member() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $fn$
begin
 if tg_op='INSERT' then
  update public.trip_attendance set user_id=new.user_id,nickname=new.display_name
   where lower(btrim(nickname))=lower(btrim(new.display_name));
  if not found then
   insert into public.trip_attendance(user_id,status,roster_key,nickname)
   values(new.user_id,'yes',new.user_id::text,new.display_name)
   on conflict(user_id) do update set nickname=excluded.nickname;
  end if;
 else
  update public.trip_attendance set nickname=new.display_name where user_id=new.user_id;
 end if;
 return new;
end;
$fn$;
revoke all on function public.sync_trip_attendance_member() from public,anon,authenticated;
create trigger sync_trip_attendance_members after insert or update of display_name on public.group_members
for each row execute function public.sync_trip_attendance_member();
revoke insert on public.trip_attendance from authenticated;
drop policy "Members insert their own attendance" on public.trip_attendance;
commit;
revoke update on public.trip_attendance from authenticated;
grant update(status) on public.trip_attendance to authenticated;