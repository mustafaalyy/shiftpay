-- Migration: 202610080002_advances_module.sql
-- Description: Salary Advances and Installments Module (موديول السلف بالتقسيط)
-- Safe, reversible, non-breaking schema additions for ShiftPay HR.

create table if not exists public.advances (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  total_amount numeric not null check (total_amount > 0),
  disbursement_date date not null default current_date,
  installments_count integer not null check (installments_count >= 1),
  start_month text not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'closed', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advance_installments (
  id text primary key,
  advance_id text not null references public.advances(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  installment_index integer not null check (installment_index >= 1),
  due_month text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'due' check (status in ('due', 'deducted', 'postponed')),
  deducted_at timestamptz,
  deducted_amount numeric default 0 check (deducted_amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for high-performance lookups & reports
create index if not exists idx_advances_company_employee on public.advances(company_id, employee_id);
create index if not exists idx_advances_status on public.advances(company_id, status);
create index if not exists idx_advance_installments_advance on public.advance_installments(advance_id);
create index if not exists idx_advance_installments_lookup on public.advance_installments(company_id, due_month, status);

-- Enable RLS
alter table public.advances enable row level security;
alter table public.advance_installments enable row level security;

-- RLS Policies: Read access for all company members
drop policy if exists "members can read advances" on public.advances;
create policy "members can read advances"
on public.advances for select to authenticated
using (private.is_company_member(public.advances.company_id));

drop policy if exists "members can read advance installments" on public.advance_installments;
create policy "members can read advance installments"
on public.advance_installments for select to authenticated
using (private.is_company_member(public.advance_installments.company_id));

-- RLS Policies: Write access strictly restricted to owner and admin roles
drop policy if exists "admins can write advances" on public.advances;
create policy "admins can write advances"
on public.advances for all to authenticated
using (private.has_company_role(public.advances.company_id, array['owner', 'admin']))
with check (private.has_company_role(public.advances.company_id, array['owner', 'admin']));

drop policy if exists "admins can write advance installments" on public.advance_installments;
create policy "admins can write advance installments"
on public.advance_installments for all to authenticated
using (private.has_company_role(public.advance_installments.company_id, array['owner', 'admin']))
with check (private.has_company_role(public.advance_installments.company_id, array['owner', 'admin']));

-- ============================================================================
-- Down Migration (Reversible):
-- To revert this migration safely run:
-- drop table if exists public.advance_installments cascade;
-- drop table if exists public.advances cascade;
-- ============================================================================
