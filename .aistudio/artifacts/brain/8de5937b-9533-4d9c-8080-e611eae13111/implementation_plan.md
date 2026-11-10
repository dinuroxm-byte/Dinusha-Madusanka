# Technical Implementation Plan: Supabase Cloud Database & RBAC Upgrade

Upgrade Voya Lanka Tours (Pvt) Ltd. from a single-browser `localStorage` architecture to a centralized, multi-user **Supabase Cloud PostgreSQL Database** featuring **Role-Based Access Control (RBAC)**, **Row Level Security (RLS)**, real-time data synchronization, and administrative user management, while strictly preserving all existing UI styling, quotation math, PDF exports, vouchers, and Excel workbooks.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Zero Code Modification During Analysis**: In accordance with user instructions, no application code has been altered in this phase.
> - **Clean Slate Architecture**: A fresh Supabase project is assumed. No legacy `localStorage` data migration scripts are required.
> - **Security Discipline**: Only the public anonymous key (`VITE_SUPABASE_ANON_KEY`) is bundled on the client. Database passwords and `service_role` keys are strictly prohibited in frontend bundles. All access controls are enforced at the PostgreSQL engine level via Row Level Security (RLS).
> - **Two-Role Authorization Model**:
>   - **`ADMIN`**: Complete system governance. User creation/management, company profile and terms updates, full CRUD on all quotations, customers, fleet pricing, hotel partners, and attraction catalogs.
>   - **`STAFF`**: Operational day-to-day workflow. Creates and updates quotations, views company settings and pricing, registers/updates customers, partner hotels, and tickets. Explicitly blocked from managing users or modifying company branding/terms by RLS.
> - **No Public Sign-Up**: Self-registration is disabled. Only administrators can provision staff accounts.

---

## 1. Existing System Audit & Findings

### A. Storage & Persistence Mechanisms
- **IndexedDB / WebSQL / SessionStorage**: None (0 occurrences).
- **LocalStorage**: All existing persistence resides in `src/utils/storage.ts` using 9 distinct keys:
  1. `ceylon_travel_saved_quotations`: Array of `SavedQuotation` records.
  2. `voya_lanka_customer_database`: Array of `CustomerRecord` CRM entries.
  3. `voya_lanka_active_partner_hotels`: Array of `PartnerHotel` items.
  4. `voya_lanka_entrance_tickets_catalog`: Array of `EntranceTicketCatalogItem`.
  5. `ceylon_travel_saved_quotations_co`: `CompanyDetails` (address, phone, email, registration).
  6. `ceylon_travel_saved_quotations_tc`: `TermsConfig` (deposit %, validity, inclusions/exclusions).
  7. `ceylon_travel_saved_quotations_logo`: Base64 `LogoData` (data URL, width, height).
  8. `ceylon_travel_saved_quotations_draft`: Active unsubmitted working quote.
  9. `voya_lanka_draft_v2`: Legacy draft cleanup key.

### B. Core Data Models (`src/types.ts`)
- **`SavedQuotation`**: Contains unique quote ID (`VL-YYMMDD-XXXX`), creation timestamp, nested customer, pax, transport, guide, pricing configurations, night-by-night room selections, custom charges, itinerary data, room voucher confirmations (`vconf`), and financial totals in LKR and USD.
- **`CustomerRecord`**: CRM client profile with contact info, country, notes, quote counter, and linked quotation IDs.
- **`PartnerHotel`**: Hotel name, destination city, and category star rating.
- **`VehicleOption` / `GuideOption`**: Fleet vehicle types with daily rates, chauffeur guides with daily fees.
- **`EntranceTicketCatalogItem`**: Sri Lanka attraction tickets with USD and LKR pricing.
- **`CompanyDetails` & `TermsConfig`**: Business registration, bank details, and legal quotation terms.

### C. Existing Authentication
- Currently **none**: The application operates without authentication. Any visitor directly accesses the quotation builder.

---

## 2. Proposed Supabase Database Schema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL DB                          │
├──────────────────────────┬─────────────────────────────────────────────┤
│ auth.users (Supabase)    │ Managed by Supabase Auth                    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ public.profiles          │ id (PK -> auth.users), email, role, name    │
│ public.company_settings  │ id=1 (Singleton), name, reg, bank, logo, tc │
│ public.customers         │ id (PK), name, email, phone, country, notes │
│ public.quotations        │ id (PK), cust_name, totals, quotation_data  │
│ public.partner_hotels    │ id (PK), name, destination, category, rates │
│ public.vehicles          │ id (PK), label, rate, capacity, is_active   │
│ public.guide_rates       │ id (PK), label, rate, language, is_active   │
│ public.entrance_tickets  │ id (PK), name, price_usd, price_lkr, cat    │
│ public.user_drafts       │ user_id (PK -> auth.users), draft_data      │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Table Definitions

1. **`profiles`**
   - `id` (uuid, PK, references `auth.users(id)` ON DELETE CASCADE)
   - `email` (text, NOT NULL)
   - `full_name` (text, NOT NULL)
   - `role` (text, NOT NULL, CHECK `role IN ('ADMIN', 'STAFF')`, DEFAULT `'STAFF'`)
   - `created_at` (timestamptz, DEFAULT now())
   - `updated_at` (timestamptz, DEFAULT now())

2. **`company_settings`** (Singleton row with `id = 1`)
   - `id` (integer, PK, DEFAULT 1, CHECK `id = 1`)
   - `name` (text, NOT NULL DEFAULT 'Voya Lanka Tours (Pvt) Ltd.')
   - `address` (text NOT NULL)
   - `phone` (text NOT NULL)
   - `email` (text NOT NULL)
   - `website` (text NOT NULL)
   - `reg` (text NOT NULL)
   - `bank_details` (text)
   - `logo_data` (text, base64 data URL or storage URL)
   - `terms_config` (jsonb NOT NULL)
   - `updated_at` (timestamptz DEFAULT now())
   - `updated_by` (uuid, references `auth.users(id)`)

3. **`customers`**
   - `id` (text, PK, e.g. `cust_...`)
   - `name` (text, NOT NULL)
   - `email` (text)
   - `phone` (text)
   - `country` (text)
   - `notes` (text)
   - `total_quotes` (integer DEFAULT 0)
   - `quote_ids` (text[] DEFAULT '{}')
   - `created_date` (timestamptz DEFAULT now())
   - `last_quoted_date` (timestamptz DEFAULT now())
   - `created_by` (uuid references `auth.users(id)`)
   - `updated_at` (timestamptz DEFAULT now())

4. **`quotations`**
   - `id` (text, PK, e.g. `VL-260310-8472`)
   - `customer_name` (text NOT NULL)
   - `customer_email` (text)
   - `customer_phone` (text)
   - `customer_country` (text)
   - `travel_date` (text)
   - `days` (integer DEFAULT 1)
   - `adults` (integer DEFAULT 2)
   - `fin_lkr` (numeric DEFAULT 0)
   - `fin_usd` (numeric DEFAULT 0)
   - `quotation_data` (jsonb NOT NULL) -- Full payload preserving exact client structures
   - `created_by` (uuid references `auth.users(id)`)
   - `created_by_name` (text)
   - `created_at` (timestamptz DEFAULT now())
   - `updated_at` (timestamptz DEFAULT now())

5. **`partner_hotels`**
   - `id` (uuid, PK DEFAULT gen_random_uuid())
   - `name` (text NOT NULL)
   - `destination` (text NOT NULL)
   - `category` (text NOT NULL)
   - `created_by` (uuid references `auth.users(id)`)
   - `created_at` (timestamptz DEFAULT now())
   - UNIQUE constraint on `(lower(name), lower(destination))`

6. **`vehicles`** & **`guide_rates`**
   - Fleet models and daily chauffeur guide allowances stored centrally so admins can adjust company fleet pricing without code redeployment.

7. **`entrance_tickets`**
   - `id` (text, PK)
   - `name` (text NOT NULL)
   - `price_usd` (numeric NOT NULL)
   - `price_lkr` (numeric NOT NULL)
   - `category` (text NOT NULL)

8. **`user_drafts`**
   - `user_id` (uuid, PK references `auth.users(id)` ON DELETE CASCADE)
   - `draft_data` (jsonb NOT NULL)
   - `updated_at` (timestamptz DEFAULT now())
   - *Rationale*: Storing drafts per-user prevents staff members from colliding or overwriting each other's live working form state.

---

## 3. User Roles & Permissions Matrix

| Resource / Action | Unauthenticated | STAFF Role | ADMIN Role | Enforced By |
|---|:---:|:---:|:---:|:---:|
| **App Access** | Login Screen Only | Full Dashboard | Full Dashboard | React Auth Guard |
| **View Quotations** | ❌ Blocked | ✅ View All | ✅ View All | RLS Policy |
| **Create / Update Quotations** | ❌ Blocked | ✅ Permitted | ✅ Permitted | RLS Policy |
| **Delete Quotations** | ❌ Blocked | ❌ Denied | ✅ Permitted | RLS Policy |
| **View Customers (CRM)** | ❌ Blocked | ✅ View All | ✅ View All | RLS Policy |
| **Upsert Customers** | ❌ Blocked | ✅ Permitted | ✅ Permitted | RLS Policy |
| **Delete Customers** | ❌ Blocked | ❌ Denied | ✅ Permitted | RLS Policy |
| **View Hotels & Rates** | ❌ Blocked | ✅ View All | ✅ View All | RLS Policy |
| **Add / Edit Hotels** | ❌ Blocked | ✅ Permitted | ✅ Permitted | RLS Policy |
| **Delete Hotels / Reset Defaults** | ❌ Blocked | ❌ Denied | ✅ Permitted | RLS Policy |
| **View Company Settings & Terms**| ❌ Blocked | ✅ View Only | ✅ View Only | RLS Policy |
| **Update Company Info & Logo** | ❌ Blocked | ❌ Denied | ✅ Permitted | RLS Policy |
| **Update Default Terms & Policy**| ❌ Blocked | ❌ Denied | ✅ Permitted | RLS Policy |
| **User Management (Create Staff)**| ❌ Blocked | ❌ Denied | ✅ Full Access | RLS & Secure RPC |
| **Public Proposal Link View** | ✅ Read-only (`quote=...`) | ✅ Read-only | ✅ Read-only | Client URL Decoder |

---

## 4. Required Supabase SQL Setup

```sql
-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. User Profiles Table & Roles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('ADMIN', 'STAFF')) default 'STAFF',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Security Definer function to check admin status without RLS recursion
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- Profiles RLS
create policy "Users can view their own profile or Admins view all"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- 3. Company Settings (Singleton id=1)
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
  updated_by uuid references auth.users(id)
);

alter table public.company_settings enable row level security;

create policy "All staff can view company settings"
  on public.company_settings for select
  using (auth.role() = 'authenticated');

create policy "Only Admins can update company settings"
  on public.company_settings for update
  using (public.is_admin());

-- 4. Quotations Table
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
  created_by uuid references auth.users(id),
  created_by_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.quotations enable row level security;

create policy "Authenticated users can view quotations"
  on public.quotations for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can create quotations"
  on public.quotations for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update quotations"
  on public.quotations for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete quotations"
  on public.quotations for delete
  using (public.is_admin());

-- 5. Customers Table (CRM)
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
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

alter table public.customers enable row level security;

create policy "Authenticated users can view customers"
  on public.customers for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert customers"
  on public.customers for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update customers"
  on public.customers for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete customers"
  on public.customers for delete
  using (public.is_admin());

-- 6. Partner Hotels Table
create table if not exists public.partner_hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  category text not null default '4-Star Premium',
  created_at timestamptz default now(),
  constraint unique_partner_hotel unique (name, destination)
);

alter table public.partner_hotels enable row level security;

create policy "Authenticated users can view partner hotels"
  on public.partner_hotels for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert partner hotels"
  on public.partner_hotels for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update partner hotels"
  on public.partner_hotels for update
  using (auth.role() = 'authenticated');

create policy "Only Admins can delete partner hotels"
  on public.partner_hotels for delete
  using (public.is_admin());

-- 7. Entrance Tickets Table
create table if not exists public.entrance_tickets (
  id text primary key,
  name text not null,
  price_usd numeric not null,
  price_lkr numeric not null,
  category text not null,
  sort_order integer default 0
);

alter table public.entrance_tickets enable row level security;

create policy "Authenticated users can view entrance tickets"
  on public.entrance_tickets for select
  using (auth.role() = 'authenticated');

create policy "Only Admins can modify tickets"
  on public.entrance_tickets for all
  using (public.is_admin());

-- 8. User Working Drafts (Isolated per user)
create table if not exists public.user_drafts (
  user_id uuid references auth.users(id) on delete cascade primary key,
  draft_data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.user_drafts enable row level security;

create policy "Users can manage only their own draft"
  on public.user_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. Secure Function for Admin to Create Staff Accounts
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
    raise exception 'Unauthorized: Only administrators can create user accounts.';
  end if;

  -- Create user in auth.users
  new_uid := extensions.uuid_generate_v4();
  
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role
  ) values (
    new_uid,
    '00000000-0000-0000-0000-000000000000',
    new_email,
    crypt(new_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('full_name', new_full_name, 'role', new_role),
    now(),
    now(),
    'authenticated'
  );

  insert into public.profiles (id, email, full_name, role)
  values (new_uid, new_email, new_full_name, new_role);

  return jsonb_build_object('success', true, 'user_id', new_uid);
end;
$$;
```

---

## 5. Application Files Requiring Modifications

1. **`package.json`**:
   - Add `@supabase/supabase-js`.
2. **`.env.example`** & environment config:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **`src/lib/supabase.ts`** *(New)*:
   - Initialize and export typed Supabase client with realtime channels and session management.
4. **`src/types.ts`**:
   - Add `UserProfile`, `UserRole` (`ADMIN` | `STAFF`), and Supabase response interfaces.
5. **`src/utils/supabaseStorage.ts`** *(New)*:
   - Complete cloud asynchronous data layer replacing `src/utils/storage.ts` for quotations, customers, hotels, company info, and tickets, with optimistic caching and realtime subscriptions.
6. **`src/components/AuthModal.tsx`** *(New)*:
   - Clean, branded modal for user sign-in and password management.
7. **`src/components/UserManagementModal.tsx`** *(New)*:
   - Admin-only modal to view all staff members, provision new staff accounts, and manage permissions.
8. **`src/components/Header.tsx`**:
   - Display active user badge with role pill (`ADMIN` in amber/emerald, `STAFF` in sky), "User Management" button (admin only), live cloud sync indicator, and Sign Out button.
9. **`src/components/CompanyModal.tsx`**:
   - Disable input fields and show "Admin Only" notice when logged in as `STAFF`.
10. **`src/components/SavedModal.tsx`**:
    - Hide/disable "Clear All History" button for `STAFF`; display creator of quotation.
11. **`src/components/CustomerDatabaseModal.tsx`**:
    - Hide/disable customer delete buttons for `STAFF`.
12. **`src/components/PartnerHotelsModal.tsx`**:
    - Hide/disable hotel delete and "Restore Defaults" button for `STAFF`.
13. **`src/App.tsx`**:
    - Integrate `auth` state listener, load data from Supabase on authentication, hook into Supabase Realtime subscriptions (so when one user saves a quote or updates a customer, other active users receive instant updates without refreshing).

---

## 6. Implementation Sequence

1. **Dependency & Environment Setup**:
   - Install `@supabase/supabase-js`.
   - Setup client configuration with graceful configuration check (shows helpful connection prompt if keys are missing).
2. **Database Types & Client Creation**:
   - Implement `src/lib/supabase.ts` and `src/types.ts` role definitions.
3. **Data Access Layer**:
   - Build `src/utils/supabaseStorage.ts` with complete CRUD and realtime listener hooks.
4. **Authentication & Session Handling**:
   - Implement `AuthModal.tsx` and auth state listener in `App.tsx`.
   - Prevent unauthorized access while preserving public shared quotation proposal view (`OnlineProposalView.tsx`).
5. **Role-Based UI Hardening**:
   - Update `Header.tsx` with user profile pill and User Management button.
   - Enforce UI permissions in `CompanyModal`, `SavedModal`, `CustomerDatabaseModal`, and `PartnerHotelsModal`.
6. **Admin User Management**:
   - Create `UserManagementModal.tsx` for creating staff accounts and viewing active users.
7. **Realtime Synchronization & Loading Indicators**:
   - Add non-intrusive cloud sync badge in header ("Cloud Connected" / "Syncing...").
8. **Testing & Verification**:
   - Run `lint_applet` (`tsc --noEmit`) and `compile_applet`.
   - Verify all PDF exports, calculations, and vouchers function seamlessly with Supabase.
