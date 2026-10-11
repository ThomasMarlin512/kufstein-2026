create table public.trip_text_content (
 site_id text not null check(site_id='kufstein-2026'),
 content_key text not null,
 content text check(content is null or char_length(content)<=12000),
 revision integer not null default 0,
 updated_at timestamptz not null default now(),
 primary key(site_id,content_key)
);
alter table public.trip_text_content enable row level security;
revoke all on public.trip_text_content from public,anon,authenticated;
grant select on public.trip_text_content to anon,authenticated;
create policy "Published website text is readable" on public.trip_text_content for select to anon,authenticated using(true);

create function group_private.save_trip_text(p_site_id text,p_content_key text,p_content text,p_revision integer)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_row public.trip_text_content%rowtype;
begin
 if auth.uid() is null or not group_private.is_admin() then raise exception 'Nur die Gruppenverwaltung darf Texte bearbeiten'; end if;
 if p_content is not null and char_length(p_content)>12000 then raise exception 'Text ist zu lang (maximal 12000 Zeichen)'; end if;
 select * into v_row from public.trip_text_content where site_id=p_site_id and content_key=p_content_key for update;
 if not found then raise exception 'Textfeld nicht gefunden'; end if;
 if v_row.revision is distinct from p_revision then raise exception 'Dieser Text wurde inzwischen geändert. Kopiere deinen Entwurf und lade die Seite neu.'; end if;
 update public.trip_text_content set content=p_content,revision=revision+1,updated_at=now()
 where site_id=p_site_id and content_key=p_content_key returning * into v_row;
 return jsonb_build_object('content_key',v_row.content_key,'content',v_row.content,'revision',v_row.revision);
end $$;
create function public.save_trip_text(p_site_id text,p_content_key text,p_content text,p_revision integer)
returns jsonb language sql security invoker set search_path=''
as $$ select group_private.save_trip_text(p_site_id,p_content_key,p_content,p_revision) $$;
revoke all on function group_private.save_trip_text(text,text,text,integer),public.save_trip_text(text,text,text,integer) from public,anon,authenticated;
grant execute on function group_private.save_trip_text(text,text,text,integer),public.save_trip_text(text,text,text,integer) to authenticated;

insert into public.trip_text_content(site_id,content_key) values
('kufstein-2026','info-001'),
('kufstein-2026','info-002'),
('kufstein-2026','info-003'),
('kufstein-2026','info-004'),
('kufstein-2026','info-005'),
('kufstein-2026','info-006'),
('kufstein-2026','info-007'),
('kufstein-2026','info-008'),
('kufstein-2026','info-009'),
('kufstein-2026','info-010'),
('kufstein-2026','info-011'),
('kufstein-2026','info-012'),
('kufstein-2026','info-013'),
('kufstein-2026','info-014'),
('kufstein-2026','info-015'),
('kufstein-2026','info-016'),
('kufstein-2026','info-017'),
('kufstein-2026','info-018'),
('kufstein-2026','info-019'),
('kufstein-2026','info-020'),
('kufstein-2026','info-021'),
('kufstein-2026','info-022'),
('kufstein-2026','info-023'),
('kufstein-2026','info-024'),
('kufstein-2026','info-025'),
('kufstein-2026','info-026'),
('kufstein-2026','info-027'),
('kufstein-2026','info-028'),
('kufstein-2026','info-029'),
('kufstein-2026','info-030'),
('kufstein-2026','info-031'),
('kufstein-2026','info-032'),
('kufstein-2026','info-033'),
('kufstein-2026','info-034'),
('kufstein-2026','info-035'),
('kufstein-2026','info-036'),
('kufstein-2026','info-037'),
('kufstein-2026','info-038'),
('kufstein-2026','info-039'),
('kufstein-2026','info-040'),
('kufstein-2026','info-041'),
('kufstein-2026','info-042'),
('kufstein-2026','info-043'),
('kufstein-2026','info-044'),
('kufstein-2026','info-045'),
('kufstein-2026','info-046'),
('kufstein-2026','info-047'),
('kufstein-2026','info-048'),
('kufstein-2026','info-049'),
('kufstein-2026','info-050'),
('kufstein-2026','info-051'),
('kufstein-2026','info-052'),
('kufstein-2026','info-054'),
('kufstein-2026','activity-festung-time'),
('kufstein-2026','activity-festung-cost'),
('kufstein-2026','activity-festung-description'),
('kufstein-2026','activity-stadtpark-time'),
('kufstein-2026','activity-stadtpark-cost'),
('kufstein-2026','activity-stadtpark-description'),
('kufstein-2026','activity-auracher-time'),
('kufstein-2026','activity-auracher-cost'),
('kufstein-2026','activity-auracher-description'),
('kufstein-2026','activity-braeu-time'),
('kufstein-2026','activity-braeu-cost'),
('kufstein-2026','activity-braeu-description'),
('kufstein-2026','activity-stollen-time'),
('kufstein-2026','activity-stollen-cost'),
('kufstein-2026','activity-stollen-description'),
('kufstein-2026','activity-pure-time'),
('kufstein-2026','activity-pure-cost'),
('kufstein-2026','activity-pure-description'),
('kufstein-2026','activity-walk-time'),
('kufstein-2026','activity-walk-cost'),
('kufstein-2026','activity-walk-description');
