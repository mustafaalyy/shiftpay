-- ========================================================
-- ShiftPay HR: Security & Multi-Tenancy Hardening
-- ========================================================

-- 1. إصلاح صلاحيات إضافة الأعضاء في جدول company_members لمنع انتحال صفة مالك الشركة:
drop policy if exists "users and admins can insert memberships" on public.company_members;

create policy "users and admins can insert memberships"
on public.company_members for insert
to authenticated
with check (
  (
    user_id = (select auth.uid()) 
    and exists (
      select 1 from public.companies c 
      where c.id = public.company_members.company_id 
        and c.owner_user_id = (select auth.uid())
    )
  )
  or private.has_company_role(public.company_members.company_id, array['owner', 'admin'])
);

-- 2. تأمين جدول إعدادات الموقع site_settings وحصر التعديل على إيميل المشرف:
drop policy if exists "site_settings_authenticated_insert" on public.site_settings;
drop policy if exists "site_settings_authenticated_update" on public.site_settings;

create policy "site_settings_authenticated_insert"
on public.site_settings
for insert
to authenticated
with check (
  (select email from auth.users where id = auth.uid()) in (
    'mustafaaly860@gmail.com', 
    current_setting('app.site_admin_email', true)
  )
);

create policy "site_settings_authenticated_update"
on public.site_settings
for update
to authenticated
using (
  (select email from auth.users where id = auth.uid()) in (
    'mustafaaly860@gmail.com', 
    current_setting('app.site_admin_email', true)
  )
)
with check (
  (select email from auth.users where id = auth.uid()) in (
    'mustafaaly860@gmail.com', 
    current_setting('app.site_admin_email', true)
  )
);
