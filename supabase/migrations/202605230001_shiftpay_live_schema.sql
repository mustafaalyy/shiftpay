create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'EG',
  currency text not null default 'جنيه',
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'hr', 'accountant', 'manager', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create table if not exists public.departments (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.shifts (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  start_time text not null,
  end_time text not null,
  grace_period integer not null default 0,
  late_deduction_per_minute numeric not null default 0,
  late_rules jsonb not null default '[]'::jsonb,
  overtime_rate_per_minute numeric not null default 0,
  overtime_rules jsonb not null default '[]'::jsonb,
  segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  department_id text references public.departments(id) on delete set null,
  shift_id text references public.shifts(id) on delete set null,
  salary numeric not null default 0,
  vacation_balance numeric not null default 0,
  extra_deductions numeric not null default 0,
  bonuses numeric not null default 0,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.attendance_reports (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  month text not null,
  file_name text not null,
  rows_count integer not null default 0,
  logs jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'paid')),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.payroll_snapshots (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id text references public.attendance_reports(id) on delete set null,
  month text not null,
  rows jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'paid')),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.company_holiday_overrides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  holiday_date date not null,
  name text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, holiday_date, name)
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = target_company_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.has_company_role(target_company_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = target_company_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.has_company_role(uuid, text[]) to authenticated;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.departments enable row level security;
alter table public.shifts enable row level security;
alter table public.employees enable row level security;
alter table public.attendance_reports enable row level security;
alter table public.payroll_snapshots enable row level security;
alter table public.audit_logs enable row level security;
alter table public.company_holiday_overrides enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.companies,
  public.company_members,
  public.departments,
  public.shifts,
  public.employees,
  public.attendance_reports,
  public.payroll_snapshots,
  public.audit_logs,
  public.company_holiday_overrides
to authenticated;

drop policy if exists "members can view their companies" on public.companies;
create policy "members can view their companies"
on public.companies for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or private.is_company_member(id)
);

drop policy if exists "users can create owned companies" on public.companies;
create policy "users can create owned companies"
on public.companies for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

drop policy if exists "owners and admins can update companies" on public.companies;
create policy "owners and admins can update companies"
on public.companies for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  or private.has_company_role(id, array['owner', 'admin'])
)
with check (
  owner_user_id = (select auth.uid())
  or private.has_company_role(id, array['owner', 'admin'])
);

drop policy if exists "members can view company members" on public.company_members;
create policy "members can view company members"
on public.company_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_company_member(public.company_members.company_id)
);

drop policy if exists "users and admins can insert memberships" on public.company_members;
create policy "users and admins can insert memberships"
on public.company_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or private.has_company_role(public.company_members.company_id, array['owner', 'admin'])
);

drop policy if exists "admins can update memberships" on public.company_members;
create policy "admins can update memberships"
on public.company_members for update
to authenticated
using (
  private.has_company_role(public.company_members.company_id, array['owner', 'admin'])
)
with check (
  private.has_company_role(public.company_members.company_id, array['owner', 'admin'])
);

drop policy if exists "members can read tenant data" on public.departments;
create policy "members can read tenant data"
on public.departments for select to authenticated
using (private.is_company_member(public.departments.company_id));

drop policy if exists "members can write tenant data" on public.departments;
create policy "members can write tenant data"
on public.departments for all to authenticated
using (private.has_company_role(public.departments.company_id, array['owner', 'admin', 'hr']))
with check (private.has_company_role(public.departments.company_id, array['owner', 'admin', 'hr']));

drop policy if exists "members can read shifts" on public.shifts;
create policy "members can read shifts"
on public.shifts for select to authenticated
using (private.is_company_member(public.shifts.company_id));

drop policy if exists "members can write shifts" on public.shifts;
create policy "members can write shifts"
on public.shifts for all to authenticated
using (private.has_company_role(public.shifts.company_id, array['owner', 'admin', 'hr']))
with check (private.has_company_role(public.shifts.company_id, array['owner', 'admin', 'hr']));

drop policy if exists "members can read employees" on public.employees;
create policy "members can read employees"
on public.employees for select to authenticated
using (private.is_company_member(public.employees.company_id));

drop policy if exists "members can write employees" on public.employees;
create policy "members can write employees"
on public.employees for all to authenticated
using (private.has_company_role(public.employees.company_id, array['owner', 'admin', 'hr', 'accountant']))
with check (private.has_company_role(public.employees.company_id, array['owner', 'admin', 'hr', 'accountant']));

drop policy if exists "members can read attendance reports" on public.attendance_reports;
create policy "members can read attendance reports"
on public.attendance_reports for select to authenticated
using (private.is_company_member(public.attendance_reports.company_id));

drop policy if exists "members can write attendance reports" on public.attendance_reports;
create policy "members can write attendance reports"
on public.attendance_reports for all to authenticated
using (private.has_company_role(public.attendance_reports.company_id, array['owner', 'admin', 'hr', 'accountant']))
with check (private.has_company_role(public.attendance_reports.company_id, array['owner', 'admin', 'hr', 'accountant']));

drop policy if exists "members can read payroll snapshots" on public.payroll_snapshots;
create policy "members can read payroll snapshots"
on public.payroll_snapshots for select to authenticated
using (private.is_company_member(public.payroll_snapshots.company_id));

drop policy if exists "accounting roles can write payroll snapshots" on public.payroll_snapshots;
create policy "accounting roles can write payroll snapshots"
on public.payroll_snapshots for all to authenticated
using (private.has_company_role(public.payroll_snapshots.company_id, array['owner', 'admin', 'accountant']))
with check (private.has_company_role(public.payroll_snapshots.company_id, array['owner', 'admin', 'accountant']));

drop policy if exists "members can read audit logs" on public.audit_logs;
create policy "members can read audit logs"
on public.audit_logs for select to authenticated
using (private.has_company_role(public.audit_logs.company_id, array['owner', 'admin', 'accountant']));

drop policy if exists "members can insert audit logs" on public.audit_logs;
create policy "members can insert audit logs"
on public.audit_logs for insert to authenticated
with check (private.is_company_member(public.audit_logs.company_id));

drop policy if exists "members can read holiday overrides" on public.company_holiday_overrides;
create policy "members can read holiday overrides"
on public.company_holiday_overrides for select to authenticated
using (private.is_company_member(public.company_holiday_overrides.company_id));

drop policy if exists "admins can write holiday overrides" on public.company_holiday_overrides;
create policy "admins can write holiday overrides"
on public.company_holiday_overrides for all to authenticated
using (private.has_company_role(public.company_holiday_overrides.company_id, array['owner', 'admin', 'hr']))
with check (private.has_company_role(public.company_holiday_overrides.company_id, array['owner', 'admin', 'hr']));

create index if not exists idx_company_members_user on public.company_members(user_id);
create index if not exists idx_company_members_company on public.company_members(company_id);
create index if not exists idx_employees_company on public.employees(company_id);
create index if not exists idx_attendance_reports_company on public.attendance_reports(company_id, month);
create index if not exists idx_payroll_snapshots_company on public.payroll_snapshots(company_id, month);
create index if not exists idx_audit_logs_company on public.audit_logs(company_id, created_at desc);
