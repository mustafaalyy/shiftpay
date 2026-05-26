drop policy if exists "site_settings_authenticated_update" on public.site_settings;
drop policy if exists "site_settings_authenticated_insert" on public.site_settings;

create policy "site_settings_authenticated_update"
on public.site_settings for update to authenticated
using (
  (select email from auth.users where id = auth.uid()) 
  = current_setting('app.site_admin_email', true)
)
with check (
  (select email from auth.users where id = auth.uid()) 
  = current_setting('app.site_admin_email', true)
);

create policy "site_settings_authenticated_insert"
on public.site_settings for insert to authenticated
with check (
  (select email from auth.users where id = auth.uid()) 
  = current_setting('app.site_admin_email', true)
);
