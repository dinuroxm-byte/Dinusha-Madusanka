-- ============================================================================
-- VOYA LANKA TOURS (PVT) LTD. - SUPABASE DATABASE INITIALIZATION SCRIPT
-- ============================================================================
-- Run this complete script in your Supabase Project:
-- Dashboard -> SQL Editor -> New Query -> Paste and Run
-- ============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 2. User Profiles Table (RBAC: ADMIN & STAFF)
-- ============================================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('ADMIN', 'STAFF')) default 'STAFF',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Helper function with SECURITY DEFINER to verify admin status without RLS recursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
create policy "Users can view their own profile or Admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Admins can update user profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete user profiles"
  on public.profiles for delete
  using (public.is_admin() and auth.uid() != id);

-- Auto-create profile trigger on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'STAFF')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 3. Company Settings (Singleton row with id = 1)
-- ============================================================================
create table if not exists public.company_settings (
  id integer primary key default 1 check (id = 1),
  name text not null default 'Voya Lanka Tours (Pvt) Ltd.',
  address text not null default 'No. 93/2, Dabare Mawatha, Narahenpita, Colombo 05, Sri Lanka',
  phone text not null default '+94 77 021 6300',
  email text not null default 'info@voyalankatours.com',
  website text not null default 'www.voyalankatours.com',
  reg text not null default 'SLTDA/SQA/PRO/01294',
  bank_details text default '',
  logo_data text default null,
  terms_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.company_settings enable row level security;

create policy "All authenticated staff can view company settings"
  on public.company_settings for select
  using (auth.role() = 'authenticated');

create policy "Only Admins can insert or update company settings"
  on public.company_settings for all
  using (public.is_admin());

-- Insert initial singleton row
insert into public.company_settings (id, name, address, phone, email, website, reg)
values (
  1,
  'Voya Lanka Tours (Pvt) Ltd.',
  'No. 93/2, Dabare Mawatha, Narahenpita, Colombo 05, Sri Lanka',
  '+94 77 021 6300',
  'info@voyalankatours.com',
  'www.voyalankatours.com',
  'SLTDA/SQA/PRO/01294'
)
on conflict (id) do nothing;

-- ============================================================================
-- 4. Quotations Table (Centralized Cloud Repository)
-- ============================================================================
create table if not exists public.quotations (
  id text primary key,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_country text,
  travel_date text,
  days integer not null default 1,
  adults integer not null default 2,
  fin_lkr numeric not null default 0,
  fin_usd numeric not null default 0,
  quotation_data jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_quotations_created_at on public.quotations (created_at desc);

alter table public.quotations enable row level security;

create policy "All authenticated staff can view company quotations"
  on public.quotations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated staff can create quotations"
  on public.quotations for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated staff can update quotations"
  on public.quotations for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete quotations"
  on public.quotations for delete
  using (public.is_admin());

-- ============================================================================
-- 5. Customers Table (Centralized CRM Database)
-- ============================================================================
create table if not exists public.customers (
  id text primary key,
  name text not null,
  email text,
  phone text,
  country text,
  notes text,
  total_quotes integer default 0,
  quote_ids text[] default '{}',
  created_date timestamptz default now(),
  last_quoted_date timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now()
);

create index if not exists idx_customers_last_quoted on public.customers (last_quoted_date desc);

alter table public.customers enable row level security;

create policy "All authenticated staff can view customers"
  on public.customers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated staff can insert customers"
  on public.customers for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated staff can update customers"
  on public.customers for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete customers"
  on public.customers for delete
  using (public.is_admin());

-- ============================================================================
-- 6. Partner Hotels Directory
-- ============================================================================
create table if not exists public.partner_hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  category text not null default '4-Star Premium',
  created_at timestamptz default now(),
  constraint unique_partner_hotel unique (name, destination)
);

alter table public.partner_hotels enable row level security;

create policy "All authenticated staff can view partner hotels"
  on public.partner_hotels for select
  using (auth.role() = 'authenticated');

create policy "Authenticated staff can insert partner hotels"
  on public.partner_hotels for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated staff can update partner hotels"
  on public.partner_hotels for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete partner hotels"
  on public.partner_hotels for delete
  using (public.is_admin());

-- ============================================================================
-- 7. Entrance Tickets & Activities Catalog
-- ============================================================================
create table if not exists public.entrance_tickets (
  id text primary key,
  name text not null,
  price_usd numeric not null,
  price_lkr numeric not null,
  category text not null,
  sort_order integer default 0
);

alter table public.entrance_tickets enable row level security;

create policy "All authenticated staff can view tickets"
  on public.entrance_tickets for select
  using (auth.role() = 'authenticated');

create policy "Only Admins can insert or update tickets"
  on public.entrance_tickets for insert
  with check (public.is_admin());

create policy "Only Admins can delete tickets"
  on public.entrance_tickets for delete
  using (public.is_admin());

-- ============================================================================
-- 8. User Drafts (Isolated per user to prevent collision)
-- ============================================================================
create table if not exists public.user_drafts (
  user_id uuid references auth.users(id) on delete cascade primary key,
  draft_data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.user_drafts enable row level security;

create policy "Users can manage only their own working draft"
  on public.user_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 9. Admin Stored Procedure for Provisioning Staff Accounts
-- ============================================================================
create or replace function public.admin_create_staff_user(
  new_email text,
  new_password text,
  new_full_name text,
  new_role text default 'STAFF'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  new_uid uuid;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can create staff accounts.';
  end if;

  new_uid := extensions.uuid_generate_v4();
  
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role
  ) values (
    new_uid, '00000000-0000-0000-0000-000000000000', new_email,
    crypt(new_password, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', new_full_name, 'role', new_role),
    now(), now(), 'authenticated'
  );

  insert into public.profiles (id, email, full_name, role)
  values (new_uid, new_email, new_full_name, new_role)
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

  return jsonb_build_object('success', true, 'user_id', new_uid);
end;
$$;

create or replace function public.admin_delete_staff_user(
  target_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  target_role text;
  target_email text;
begin
  -- 1. Ensure executing user is an administrator
  if not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can delete staff accounts.';
  end if;

  -- 2. Staff and admins cannot delete their own accounts
  if auth.uid() = target_user_id then
    raise exception 'Operation forbidden: You cannot delete your own account.';
  end if;

  -- 3. Verify target user exists and get their role & email
  select role, email into target_role, target_email
  from public.profiles
  where id = target_user_id;

  -- If profile is missing (orphaned auth account), inspect auth.users
  if target_email is null then
    select email into target_email from auth.users where id = target_user_id;
    if target_email is null then
      raise exception 'Target user not found in database or authentication.';
    end if;
  end if;

  -- 4. Protect the primary Admin account dinusha@voyalankatours.com
  if lower(coalesce(target_email, '')) = 'dinusha@voyalankatours.com' then
    raise exception 'Permission denied: The primary administrator account (dinusha@voyalankatours.com) is protected and cannot be deleted.';
  end if;

  if target_role = 'ADMIN' then
    raise exception 'Permission denied: Administrator accounts cannot be deleted through staff management.';
  end if;

  -- 5. Safeguard: Detach foreign-key references from business tables to preserve historical records
  update public.quotations set created_by = null where created_by = target_user_id;
  update public.customers set created_by = null where created_by = target_user_id;
  update public.company_settings set updated_by = null where updated_by = target_user_id;
  delete from public.user_drafts where user_id = target_user_id;

  -- 6. Delete target user from public.profiles and permanently purge from auth.users
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;

  return jsonb_build_object(
    'success', true,
    'authDeleted', true,
    'message', format('Staff account (%s) permanently deleted from authentication and database.', coalesce(target_email, target_user_id::text))
  );
end;
$$;

grant execute on function public.admin_create_staff_user(text, text, text, text) to authenticated;
grant execute on function public.admin_delete_staff_user(uuid) to authenticated;

-- ============================================================================
-- 7. User Activity & Audit Logs Table (Tamper-Proof & Append-Only)
-- ============================================================================
create table if not exists public.activity_logs (
  id uuid primary key default extensions.uuid_generate_v4(),
  created_at timestamptz default now() not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_name text not null,
  user_role text not null check (user_role in ('ADMIN', 'STAFF')) default 'STAFF',
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  details jsonb default '{}'::jsonb
);

create index if not exists idx_activity_logs_created_at on public.activity_logs (created_at desc);
create index if not exists idx_activity_logs_entity on public.activity_logs (entity_type, entity_id);
create index if not exists idx_activity_logs_action on public.activity_logs (action);
create index if not exists idx_activity_logs_user on public.activity_logs (user_email);

alter table public.activity_logs enable row level security;

-- Authenticated team members can view audit logs
create policy "Authenticated users can view audit logs"
  on public.activity_logs for select
  using (auth.role() = 'authenticated');

-- Authenticated users can insert activity logs
create policy "Authenticated users can append activity logs"
  on public.activity_logs for insert
  with check (auth.role() = 'authenticated');

-- NOTE: No UPDATE or DELETE policies are granted on public.activity_logs,
-- guaranteeing append-only tamper-proof audit trails for legal and regulatory compliance.

-- Enable Realtime publication for tables
alter publication supabase_realtime add table public.quotations;
alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.partner_hotels;
alter publication supabase_realtime add table public.company_settings;
alter publication supabase_realtime add table public.activity_logs;
