-- Kufstein V3.5: vorbereitetes Schema; bestehende Stimmen bleiben unverändert.
create extension if not exists pgcrypto;
create table if not exists public.participant_access (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid unique references auth.users(id) on delete restrict,
  invite_token_hash text unique not null,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  constraint pin_hash_nonempty check (length(pin_hash)>20)
);
alter table public.participant_access enable row level security;
revoke all on public.participant_access from anon, authenticated;
create index if not exists participant_access_member_idx on public.participant_access(member_user_id);
-- Achtung: Ein reiner Datenbankeintrag mit PIN erzeugt noch keine Supabase-Auth-Sitzung.
-- Die spätere Authentifizierung muss serverseitig erfolgen (Edge Function, sichere Sitzung).
-- Niemals PINs oder Tokens in GitHub oder Browser-Quellcode hinterlegen.
