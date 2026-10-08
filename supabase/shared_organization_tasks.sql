create table public.organization_tasks (
 id text primary key,
 label text not null,
 position integer not null,
 completed boolean not null default false,
 completed_by uuid references auth.users(id) on delete set null,
 completed_by_name text,
 updated_at timestamptz not null default now(),
 constraint task_completion_name check ((completed and completed_by_name is not null) or (not completed and completed_by_name is null and completed_by is null))
);
alter table public.organization_tasks enable row level security;
revoke all on public.organization_tasks from public, anon, authenticated;
grant select on public.organization_tasks to authenticated;
create policy "Members read organization tasks" on public.organization_tasks for select to authenticated using ((select public.is_group_member()));
create function public.set_organization_task(p_id text,p_completed boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare member_name text;
begin
 if auth.uid() is null or not public.is_group_member() then raise exception 'Gruppenbeitritt erforderlich'; end if;
 if p_completed is null then raise exception 'Status erforderlich'; end if;
 select display_name into member_name from public.group_members where user_id=auth.uid();
 update public.organization_tasks set completed=p_completed,
 completed_by=case when p_completed then auth.uid() else null end,
 completed_by_name=case when p_completed then member_name else null end,
 updated_at=now() where id=p_id;
 if not found then raise exception 'Unbekannte Aufgabe'; end if;
end;
$$;
revoke all on function public.set_organization_task(text,boolean) from public,anon;
grant execute on function public.set_organization_task(text,boolean) to authenticated;
insert into public.organization_tasks(id,label,position,completed,completed_by_name) values
('hotel_breakfast','Hotelplätze und Frühstück bestätigen; frühes Frühstück für Jan & Bibi organisieren',1,true,'Manu'),
('early_checkout','Frühen Check-out für Jan & Bibi mit dem Hotel abstimmen',2,false,null),
('dinner','Tisch für 13 Personen reservieren',3,false,null),
('bars','Stollen 1930 / PURE Lounge wegen Gruppengröße anfragen',4,false,null),
('travel','Abfahrtszeiten und genaue Abholadressen bestätigen; Anreise von Daniela Marlin und Thomas Wüstner zuordnen',5,false,null),
('payments','Zahlungen und Parkkosten klären',6,false,null);