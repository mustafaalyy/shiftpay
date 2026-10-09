-- Migration: 202610100001_biometric_devices.sql
-- Description: Biometric Attendance Devices & Cloud Push Integration (أجهزة البصمة والربط السحابي المباشر)
-- Safe, reversible, multi-tenant schema for ZKTeco ADMS, Hikvision, and LAN Bridge devices.

create table if not exists public.biometric_devices (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  serial_number text not null,
  device_model text not null default 'ZKTeco ADMS Compatible',
  protocol text not null default 'adms_push' check (protocol in ('adms_push', 'lan_bridge', 'api_webhook')),
  ip_address text,
  port integer default 4370,
  location text,
  api_key text not null,
  status text not null default 'idle' check (status in ('online', 'offline', 'idle')),
  last_sync_at timestamptz,
  last_punch_count integer default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, serial_number)
);

-- Table for raw incoming biometric punches queue before processing into attendance reports
create table if not exists public.biometric_punches_queue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  device_id text references public.biometric_devices(id) on delete set null,
  device_sn text not null,
  employee_code text not null,
  punch_time timestamptz not null,
  punch_type text default 'auto' check (punch_type in ('check_in', 'check_out', 'auto')),
  processed boolean not null default false,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_biometric_devices_company on public.biometric_devices(company_id);
create index if not exists idx_biometric_devices_sn on public.biometric_devices(company_id, serial_number);
create index if not exists idx_biometric_punches_lookup on public.biometric_punches_queue(company_id, employee_code, punch_time);

-- Enable Row Level Security
alter table public.biometric_devices enable row level security;
alter table public.biometric_punches_queue enable row level security;

-- RLS Policies for biometric_devices
drop policy if exists "members can read biometric devices" on public.biometric_devices;
create policy "members can read biometric devices"
on public.biometric_devices for select to authenticated
using (private.is_company_member(public.biometric_devices.company_id));

drop policy if exists "admins can write biometric devices" on public.biometric_devices;
create policy "admins can write biometric devices"
on public.biometric_devices for all to authenticated
using (private.has_company_role(public.biometric_devices.company_id, array['owner', 'admin']))
with check (private.has_company_role(public.biometric_devices.company_id, array['owner', 'admin']));

-- RLS Policies for biometric_punches_queue
drop policy if exists "members can read punches queue" on public.biometric_punches_queue;
create policy "members can read punches queue"
on public.biometric_punches_queue for select to authenticated
using (private.is_company_member(public.biometric_punches_queue.company_id));

drop policy if exists "admins can manage punches queue" on public.biometric_punches_queue;
create policy "admins can manage punches queue"
on public.biometric_punches_queue for all to authenticated
using (private.has_company_role(public.biometric_punches_queue.company_id, array['owner', 'admin']))
with check (private.has_company_role(public.biometric_punches_queue.company_id, array['owner', 'admin']));
