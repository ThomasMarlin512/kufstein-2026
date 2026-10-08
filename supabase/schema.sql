-- Kufstein 2026: Supabase SQL Editor ausführen
create table if not exists public.votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id text not null check (length(activity_id) between 1 and 80),
  choice text not null check (choice in ('yes','maybe','no')),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_id)
);
alter table public.votes enable row level security;
create policy "Read aggregate votes" on public.votes for select to authenticated using (true);
create policy "Create own vote" on public.votes for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own vote" on public.votes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own vote" on public.votes for delete to authenticated using (auth.uid() = user_id);
-- Supabase Authentication > Providers > Anonymous Sign-Ins aktivieren.
-- Hinweis: Nutzer können mit neuen anonymen Sitzungen erneut abstimmen.
