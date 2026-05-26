create table if not exists public.site_settings (
  id text primary key default 'public',
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop policy if exists "site_settings_public_read" on public.site_settings;
drop policy if exists "site_settings_authenticated_insert" on public.site_settings;
drop policy if exists "site_settings_authenticated_update" on public.site_settings;

create policy "site_settings_public_read"
on public.site_settings
for select
using (true);

create policy "site_settings_authenticated_insert"
on public.site_settings
for insert
to authenticated
with check (auth.uid() is not null);

create policy "site_settings_authenticated_update"
on public.site_settings
for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

insert into public.site_settings (id, content)
values ('public', '{}'::jsonb)
on conflict (id) do nothing;
