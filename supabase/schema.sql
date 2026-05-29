-- ============================================================================
-- REST Client Tracker — Supabase Schema
-- ============================================================================
-- Paste this into the Supabase SQL Editor for your project and run it once.
-- Safe to re-run (idempotent: create-if-not-exists, add-column-if-not-exists,
-- create-or-replace functions, drop-then-create policies/triggers).
--
-- Tables: profiles, clients, appointments, completed_jobs
-- All tables RLS-enabled, scoped to auth.uid().
-- profiles row is auto-created via trigger on auth.users insert.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  account_name text,
  plan text not null default 'free' check (plan in ('free','pro','enterprise')),
  invoice_template text,
  business_name text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Columns added after initial release; backfill for existing tables.
alter table public.profiles add column if not exists account_name text;
alter table public.profiles add column if not exists invoice_template text;
alter table public.profiles add column if not exists business_name text;
alter table public.profiles add column if not exists stripe_customer_id text;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- profiles INSERT happens via trigger using SECURITY DEFINER, so no INSERT
-- policy is needed. We do NOT grant general INSERT to authenticated users.

-- ----------------------------------------------------------------------------
-- clients
-- ----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  per_cut_rate numeric not null default 0,
  expense_per_client numeric not null default 0,
  expense_type text not null default 'fixed' check (expense_type in ('fixed','percent')),
  cut_duration_minutes integer not null default 0,
  service_frequency text not null default 'weekly'
    check (service_frequency in ('one_time','weekly','biweekly','monthly','six_weeks','two_months')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- expense_type added after initial release; backfill for existing tables.
alter table public.clients add column if not exists expense_type text not null default 'fixed';

-- Service-frequency options changed: 'three_weeks' removed; 'one_time',
-- 'six_weeks', 'two_months' added. Migrate any existing 'three_weeks' rows to
-- 'monthly' (same monthly multiplier), then swap the CHECK constraint.
update public.clients set service_frequency = 'monthly' where service_frequency = 'three_weeks';
alter table public.clients drop constraint if exists clients_service_frequency_check;
alter table public.clients
  add constraint clients_service_frequency_check
  check (service_frequency in ('one_time','weekly','biweekly','monthly','six_weeks','two_months'));
alter table public.clients drop constraint if exists clients_expense_type_check;
alter table public.clients
  add constraint clients_expense_type_check
  check (expense_type in ('fixed','percent'));

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_user_updated_idx on public.clients(user_id, updated_at desc);

alter table public.clients enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
  on public.clients for select
  using (user_id = auth.uid());

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
  on public.clients for insert
  with check (user_id = auth.uid());

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
  on public.clients for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
  on public.clients for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- appointments
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  date date not null,
  time text not null,
  created_at timestamptz not null default now()
);

create index if not exists appointments_user_idx on public.appointments(user_id);
create index if not exists appointments_user_date_idx on public.appointments(user_id, date);
create index if not exists appointments_client_idx on public.appointments(client_id);

alter table public.appointments enable row level security;

drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_own"
  on public.appointments for select
  using (user_id = auth.uid());

drop policy if exists "appointments_insert_own" on public.appointments;
create policy "appointments_insert_own"
  on public.appointments for insert
  with check (user_id = auth.uid());

drop policy if exists "appointments_update_own" on public.appointments;
create policy "appointments_update_own"
  on public.appointments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "appointments_delete_own" on public.appointments;
create policy "appointments_delete_own"
  on public.appointments for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- completed_jobs
-- ----------------------------------------------------------------------------
create table if not exists public.completed_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  date date not null,
  earnings numeric not null default 0,
  time_spent integer not null default 0,
  expenses numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists completed_jobs_user_idx on public.completed_jobs(user_id);
create index if not exists completed_jobs_user_date_idx on public.completed_jobs(user_id, date);

alter table public.completed_jobs enable row level security;

drop policy if exists "completed_jobs_select_own" on public.completed_jobs;
create policy "completed_jobs_select_own"
  on public.completed_jobs for select
  using (user_id = auth.uid());

drop policy if exists "completed_jobs_insert_own" on public.completed_jobs;
create policy "completed_jobs_insert_own"
  on public.completed_jobs for insert
  with check (user_id = auth.uid());

drop policy if exists "completed_jobs_update_own" on public.completed_jobs;
create policy "completed_jobs_update_own"
  on public.completed_jobs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "completed_jobs_delete_own" on public.completed_jobs;
create policy "completed_jobs_delete_own"
  on public.completed_jobs for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- expenses (business expenses: gas, equipment, supplies, etc.)
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null default '',
  amount numeric not null default 0,
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_idx on public.expenses(user_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses for select
  using (user_id = auth.uid());

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses for insert
  with check (user_id = auth.uid());

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses for delete
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_touch_updated_at on public.clients;
create trigger clients_touch_updated_at
  before update on public.clients
  for each row execute function public.touch_updated_at();

drop trigger if exists completed_jobs_touch_updated_at on public.completed_jobs;
create trigger completed_jobs_touch_updated_at
  before update on public.completed_jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists expenses_touch_updated_at on public.expenses;
create trigger expenses_touch_updated_at
  before update on public.expenses
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- handle_new_user trigger: auto-create profile row on signup
-- Username is read from raw_user_meta_data.username (set client-side via
-- supabase.auth.signUp({ options: { data: { username } } })).
--
-- Lives in public schema so the trigger can find it; SECURITY DEFINER so it
-- can write to public.profiles even though the new user's session doesn't
-- exist yet at this moment.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- username availability RPC (callable by anon for pre-flight check on signup)
-- ----------------------------------------------------------------------------
create or replace function public.username_available(check_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(check_username)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;
