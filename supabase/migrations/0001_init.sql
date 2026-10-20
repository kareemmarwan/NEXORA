-- ============================================================
-- AI Services Store — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: objects are created with create-if-not-exists
-- guards where Postgres supports it.
-- ============================================================

-- ---------- Extensions ----------
create extension if not exists pgcrypto with schema extensions;

-- ---------- Enums ----------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.price_type as enum ('one_time', 'monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending_payment', 'payment_review', 'paid', 'in_progress',
    'delivered', 'completed', 'cancelled', 'refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method_type as enum ('manual', 'stripe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'under_review', 'paid', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.proof_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  business_name text,
  role public.user_role not null default 'customer',
  preferred_locale text,
  created_at timestamptz not null default now()
);

-- ---------- Helper functions ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'preferred_locale', 'ar')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent role escalation from clients (admins use service role or SQL).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and not public.is_admin() then
      raise exception 'Changing role is not allowed';
    end if;
    -- users cannot change their own id
    if new.id is distinct from old.id then
      raise exception 'Changing id is not allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_escalation on public.profiles;
create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- services ----------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  slug text not null unique,
  title_ar text not null,
  title_en text not null,
  short_desc_ar text,
  short_desc_en text,
  description_ar text,
  description_en text,
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  price_type public.price_type not null default 'one_time',
  delivery_days int not null default 5,
  revisions int not null default 2,
  features_ar jsonb not null default '[]'::jsonb,
  features_en jsonb not null default '[]'::jsonb,
  requirements_ar jsonb not null default '[]'::jsonb,
  requirements_en jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  cover_image_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- service_addons ----------
create table if not exists public.service_addons (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  price numeric(10,2) not null default 0,
  extra_days int not null default 0,
  is_active boolean not null default true
);

-- ---------- payment_methods ----------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  type public.payment_method_type not null default 'manual',
  label_ar text not null,
  label_en text not null,
  details_ar text,
  details_en text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ---------- orders ----------
create sequence if not exists public.orders_seq start 1;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
declare
  y text := to_char(now(), 'YYYY');
  n bigint;
begin
  if new.order_number is null or new.order_number = '' then
    n := nextval('public.orders_seq');
    new.order_number := 'AS-' || y || '-' || lpad(n::text, 6, '0');
  end if;
  return new;
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.order_status not null default 'pending_payment',
  payment_method_type public.payment_method_type not null default 'manual',
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency text not null default 'USD',
  customer_notes text,
  brief jsonb,
  stripe_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  delivered_at timestamptz,
  delivery_notes text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists orders_generate_order_number on public.orders;
create trigger orders_generate_order_number
  before insert on public.orders
  for each row execute function public.generate_order_number();

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  title_snapshot_ar text not null,
  title_snapshot_en text not null,
  unit_price numeric(10,2) not null,
  delivery_days int not null default 5,
  quantity int not null default 1 check (quantity between 1 and 5),
  addons jsonb not null default '[]'::jsonb
);

-- ---------- payment_proofs ----------
create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_path text not null,
  note text,
  status public.proof_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- order_events ----------
create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null,
  from_status public.order_status,
  to_status public.order_status,
  actor_id uuid references public.profiles (id) on delete set null,
  message text,
  created_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- Indexes ----------
create index if not exists services_category_id_idx on public.services (category_id);
create index if not exists services_active_sort_idx on public.services (is_active, sort_order);
create index if not exists services_featured_idx on public.services (is_featured) where is_featured;
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists payment_proofs_order_id_idx on public.payment_proofs (order_id);
create index if not exists order_events_order_id_idx on public.order_events (order_id, created_at);
create index if not exists service_addons_service_id_idx on public.service_addons (service_id);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.service_addons enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.order_events enable row level security;

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'customer');

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- categories (public read of active rows)
drop policy if exists "categories_select_active" on public.categories;
create policy "categories_select_active" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- services
drop policy if exists "services_select_active" on public.services;
create policy "services_select_active" on public.services
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "services_admin_all" on public.services;
create policy "services_admin_all" on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- service_addons
drop policy if exists "service_addons_select_active" on public.service_addons;
create policy "service_addons_select_active" on public.service_addons
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "service_addons_admin_all" on public.service_addons;
create policy "service_addons_admin_all" on public.service_addons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- payment_methods
drop policy if exists "payment_methods_select_active" on public.payment_methods;
create policy "payment_methods_select_active" on public.payment_methods
  for select to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "payment_methods_admin_all" on public.payment_methods;
create policy "payment_methods_admin_all" on public.payment_methods
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- orders: owners read their own; writes only via service role (no insert/update policies
-- for customers other than reading). Admin has full access.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_items: readable with the order
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- payment_proofs: owner can read own and insert proofs for own orders
drop policy if exists "payment_proofs_select_own" on public.payment_proofs;
create policy "payment_proofs_select_own" on public.payment_proofs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payment_proofs_insert_own" on public.payment_proofs;
create policy "payment_proofs_insert_own" on public.payment_proofs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = payment_proofs.order_id
        and o.user_id = auth.uid()
        and o.status in ('pending_payment', 'payment_review')
    )
  );

drop policy if exists "payment_proofs_admin_all" on public.payment_proofs;
create policy "payment_proofs_admin_all" on public.payment_proofs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- order_events: owner reads timeline; admin manages
drop policy if exists "order_events_select_own" on public.order_events;
create policy "order_events_select_own" on public.order_events
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_events_admin_all" on public.order_events;
create policy "order_events_admin_all" on public.order_events
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs', 'payment-proofs', false, 5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-covers', 'service-covers', true, 4194304,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "payment_proofs_owner_upload" on storage.objects;
create policy "payment_proofs_owner_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "payment_proofs_owner_read" on storage.objects;
create policy "payment_proofs_owner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "service_covers_public_read" on storage.objects;
create policy "service_covers_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'service-covers');

drop policy if exists "service_covers_admin_write" on storage.objects;
create policy "service_covers_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'service-covers' and public.is_admin())
  with check (bucket_id = 'service-covers' and public.is_admin());

-- ============================================================
-- First admin bootstrap (run once in the SQL editor, after
-- registering your account from the site). The escalation guard
-- trigger must be disabled because auth.uid() is null there.
--   alter table public.profiles disable trigger profiles_prevent_role_escalation;
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
--   alter table public.profiles enable trigger profiles_prevent_role_escalation;
-- ============================================================
