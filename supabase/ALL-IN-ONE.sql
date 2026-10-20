-- ============================================================
-- NEXORA — سكربت Supabase شامل (كل شيء في ملف واحد)
-- انسخ هذا الملف كاملاً والصقه في: Supabase Dashboard → SQL Editor → New query → Run
-- آمن لإعادة التنفيذ (كل الأوامر محمية بـ if-not-exists / on conflict)
-- 
-- المتطلبات الأخرى خارج هذا الملف:
--   1) من لوحة Supabase: Authentication → Providers → Email مفعّل
--   2) ضع المفاتيح في .env.local:
--      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
--   3) في نهاية الملف: علّق أسطر ترقية المدير وضع بريدك ثم أعد تنفيذها
-- ============================================================

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
-- First admin (run manually after creating your account):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- ============================================================
-- ============================================================
-- CMS tables for full site content management
-- ============================================================

-- ---------- site_settings (key-value pairs for general settings) ----------
create table if not exists public.site_settings (
  key text primary key,
  value_ar text not null default '',
  value_en text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- site_content (structured content sections) ----------
create table if not exists public.site_content (
  key text primary key,
  content_ar jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.site_settings enable row level security;
alter table public.site_content enable row level security;

-- site_settings: public read, admin write
drop policy if exists "site_settings_select_public" on public.site_settings;
create policy "site_settings_select_public" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- site_content: public read, admin write
drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public" on public.site_content
  for select to anon, authenticated
  using (true);

drop policy if exists "site_content_admin_all" on public.site_content;
create policy "site_content_admin_all" on public.site_content
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Seed default site_settings ----------
insert into public.site_settings (key, value_ar, value_en) values
  ('site_name', 'NEXORA', 'NEXORA'),
  ('site_tagline', 'ابنِ بذكاء أكبر، وانمُ بسرعة أكبر.', 'Build smarter, grow faster.'),
  ('contact_email', 'support@example.com', 'support@example.com'),
  ('contact_phone', '+970 599 000 000', '+970 599 000 000'),
  ('footer_description', 'تبني NEXORA وكلاء ذكاء اصطناعي وتؤتمت العمليات وتطور موظفين رقميين للشركات الناشئة والمشاريع النامية.', 'NEXORA builds AI agents, automates operations, and develops digital employees for startups and growing businesses.')
on conflict (key) do nothing;

-- ---------- Seed default site_content ----------
insert into public.site_content (key, content_ar, content_en) values
  ('hero', jsonb_build_object(
    'title', 'حوّل أعمالك إلى منظومة أكثر ذكاءً.',
    'subtitle', 'نبني وكلاء الذكاء الاصطناعي، ونؤتمت العمليات، ونطوّر موظفين رقميين يساعدون الشركات الناشئة والمشاريع التجارية على العمل بكفاءة أكبر.',
    'cta', 'ابدأ مشروعك',
    'secondaryCta', 'اكتشف خدماتنا',
    'brandLabel', 'وكلاء الذكاء الاصطناعي • الأتمتة • القوة العاملة الرقمية'
  ), jsonb_build_object(
    'title', 'Transform your business into a smarter ecosystem.',
    'subtitle', 'We build AI agents, automate operations, and develop digital employees that help startups and businesses work more efficiently.',
    'cta', 'Start your project',
    'secondaryCta', 'Explore our services',
    'brandLabel', 'AI Agents • Automation • Digital Workforce'
  )),
  ('services', jsonb_build_object(
    'title', 'ما نبنيه',
    'subtitle', 'حلول مدعومة بالذكاء الاصطناعي تساعد عملك على العمل بذكاء والنمو بسرعة.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'وكلاء الذكاء الاصطناعي', 'desc', 'وكلاء متخصصون ينفذون مهام محددة باستخدام الأدوات المعتمدة وبيانات الأعمال.'),
      jsonb_build_object('title', 'أتمتة الأعمال', 'desc', 'أتمتة العمليات المتكررة وربط تطبيقات أعمالك الحالية.'),
      jsonb_build_object('title', 'القوة العاملة الرقمية', 'desc', 'موظفون رقميون مدعومون بالذكاء الاصطناعي يدعمون التسويق والمبيعات وخدمة العملاء والعمليات.'),
      jsonb_build_object('title', 'تكاملات الذكاء الاصطناعي', 'desc', 'ربط نماذج وخدمات الذكاء الاصطناعي بمواقعك وتطبيقاتك وقواعد بياناتك وأنظمة أعمالك.'),
      jsonb_build_object('title', 'حلول ذكاء اصطناعي مخصصة', 'desc', 'بناء تطبيقات وأنظمة مدعومة بالذكاء الاصطناعي مصممة لمتطلبات أعمال محددة.')
    )
  ), jsonb_build_object(
    'title', 'What we build',
    'subtitle', 'AI-powered solutions that help your business work smarter and grow faster.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'AI Agents', 'desc', 'Specialized agents that execute specific tasks using authorized tools and business data.'),
      jsonb_build_object('title', 'Business Automation', 'desc', 'Automate repetitive processes and connect your existing business applications.'),
      jsonb_build_object('title', 'Digital Workforce', 'desc', 'AI-powered digital employees that support marketing, sales, customer service, and operations.'),
      jsonb_build_object('title', 'AI Integrations', 'desc', 'Connect AI models and services to your websites, apps, databases, and business systems.'),
      jsonb_build_object('title', 'Custom AI Solutions', 'desc', 'Build AI-powered applications and systems designed for specific business requirements.')
    )
  )),
  ('howItWorks', jsonb_build_object(
    'title', 'كيف نعمل',
    'subtitle', 'أربع خطوات واضحة من فهم أعمالك إلى تحقيق نتائج ملموسة.',
    'steps', jsonb_build_array(
      jsonb_build_object('title', 'نفهم أعمالك', 'desc', 'نفهم نشاطك التجاري وأهدافك.'),
      jsonb_build_object('title', 'نحدد الفرص', 'desc', 'نحدد فرص التطوير والأتمتة.'),
      jsonb_build_object('title', 'نبني الحل', 'desc', 'نطور الحل ونربط الأنظمة المطلوبة.'),
      jsonb_build_object('title', 'نحسّن الأداء', 'desc', 'نقيّم النتائج ونحسّن التنفيذ.')
    )
  ), jsonb_build_object(
    'title', 'How we work',
    'subtitle', 'Four clear steps from understanding your business to delivering tangible results.',
    'steps', jsonb_build_array(
      jsonb_build_object('title', 'Understand your business', 'desc', 'We understand your business and goals.'),
      jsonb_build_object('title', 'Identify opportunities', 'desc', 'We identify development and automation opportunities.'),
      jsonb_build_object('title', 'Build the solution', 'desc', 'We develop the solution and connect the required systems.'),
      jsonb_build_object('title', 'Optimize performance', 'desc', 'We evaluate results and optimize implementation.')
    )
  )),
  ('whyUs', jsonb_build_object(
    'title', 'لماذا NEXORA',
    'subtitle', 'حلول مصممة وفق احتياجات عملك الحقيقية، لا قوالب جاهزة.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'مصممة لعملياتك', 'desc', 'حلول مبنية حول عمليات أعمالك الفعلية وعملياتك اليومية.'),
      jsonb_build_object('title', 'عمل أقل تكراراً', 'desc', 'قلّل الوقت المستغرق في المهام الروتينية ليتفرغ فريقك لعمل أعلى قيمة.'),
      jsonb_build_object('title', 'تعمل مع أدواتك الحالية', 'desc', 'اربط إمكانيات الذكاء الاصطناعي بالبرمجيات والمنصات التي يستخدمها عملك بالفعل.'),
      jsonb_build_object('title', 'قابل للتوسع مع نموك', 'desc', 'تنفيذات تنمو مع أعمالك وتتكيف مع المتطلبات المتزايدة.'),
      jsonb_build_object('title', 'آمن مع مراجعة بشرية', 'desc', 'صلاحيات مناسبة ومراجعة بشرية مدمجة للإجراءات والقرارات الحساسة.'),
      jsonb_build_object('title', 'تحسين مستمر', 'desc', 'تقييم وتحسين مستمر عند تضمينه في نطاق العمل.')
    )
  ), jsonb_build_object(
    'title', 'Why NEXORA',
    'subtitle', 'Solutions designed for your real business needs, not ready-made templates.',
    'items', jsonb_build_array(
      jsonb_build_object('title', 'Designed for your operations', 'desc', 'Solutions built around your actual business operations and daily workflows.'),
      jsonb_build_object('title', 'Less repetitive work', 'desc', 'Reduce time spent on routine tasks so your team can focus on higher-value work.'),
      jsonb_build_object('title', 'Works with your current tools', 'desc', 'Connect AI capabilities with the software and platforms your business already uses.'),
      jsonb_build_object('title', 'Scales with your growth', 'desc', 'Implementations that grow with your business and adapt to increasing requirements.'),
      jsonb_build_object('title', 'Secure with human review', 'desc', 'Appropriate permissions and built-in human review for sensitive actions and decisions.'),
      jsonb_build_object('title', 'Continuous improvement', 'desc', 'Ongoing evaluation and optimization when embedded in scope.')
    )
  )),
  ('audience', jsonb_build_object(
    'title', 'من نعمل معهم',
    'subtitle', 'حلول للشركات في كل مرحلة نمو.',
    'items', jsonb_build_array('الشركات الناشئة', 'الشركات الصغيرة والمتوسطة', 'التجارة الإلكترونية', 'الشركات الخدمية', 'الفرق التجارية النامية')
  ), jsonb_build_object(
    'title', 'Who we work with',
    'subtitle', 'Solutions for businesses at every growth stage.',
    'items', jsonb_build_array('Startups', 'Small & Medium Businesses', 'E-commerce', 'Service Companies', 'Growing Sales Teams')
  )),
  ('faq', jsonb_build_object(
    'title', 'الأسئلة الشائعة',
    'subtitle', 'إجابات سريعة عن الخدمات والدفع والتسليم',
    'items', jsonb_build_array(
      jsonb_build_object('q', 'هل أحتاج خبرة تقنية لاستخدام الخدمة؟', 'a', 'لا. كل ما نحتاجه منك هو معلومات نشاطك، ونتولى نحن البناء والإعداد والتسليم مع شرح طريقة الاستخدام.'),
      jsonb_build_object('q', 'كم تستغرق مدة التسليم؟', 'a', 'تختلف بحسب الخدمة، وتتراوح غالباً بين يومين وعشرة أيام عمل من تأكيد الدفع واستلام المتطلبات.'),
      jsonb_build_object('q', 'هل يمكنني طلب تعديلات بعد التسليم؟', 'a', 'نعم، كل خدمة تتضمن عدد مراجعات محدداً يمكنك استخدامها خلال 7 أيام من التسليم.'),
      jsonb_build_object('q', 'كيف يتم الدفع؟', 'a', 'يمكنك الدفع يدوياً (تحويل بنكي أو محفظة إلكترونية) مع رفع إثبات الدفع، أو الدفع إلكترونياً عبر Stripe.'),
      jsonb_build_object('q', 'هل أحتاج لحساب لطلب الخدمة؟', 'a', 'نعم، نحتاج حساباً بسيطاً لمتابعة طلبك وإرسال التحديثات والتسليم.'),
      jsonb_build_object('q', 'هل البيانات التي أرسلها آمنة؟', 'a', 'نعم، جميع البيانات والملفات محفوظة بآمان وتُستخدم فقط لتنفيذ طلبك.')
    )
  ), jsonb_build_object(
    'title', 'Frequently Asked Questions',
    'subtitle', 'Quick answers about services, payment, and delivery',
    'items', jsonb_build_array(
      jsonb_build_object('q', 'Do I need technical expertise to use the service?', 'a', 'No. All we need is your business information, and we handle the building, setup, and delivery with usage instructions.'),
      jsonb_build_object('q', 'How long does delivery take?', 'a', 'It varies by service, generally between 2 and 10 business days from payment confirmation and requirements receipt.'),
      jsonb_build_object('q', 'Can I request revisions after delivery?', 'a', 'Yes, each service includes a specific number of revisions you can use within 7 days of delivery.'),
      jsonb_build_object('q', 'How do I pay?', 'a', 'You can pay manually (bank transfer or e-wallet) with proof upload, or pay electronically via Stripe.'),
      jsonb_build_object('q', 'Do I need an account to order?', 'a', 'Yes, we need a simple account to track your order and send updates and delivery.'),
      jsonb_build_object('q', 'Is my data safe?', 'a', 'Yes, all data and files are stored securely and used only to fulfill your order.')
    )
  )),
  ('pricing', jsonb_build_object(
    'title', 'أسعار بسيطة وشفافة',
    'subtitle', 'بدون رسوم مخفية. بدون التزامات. يمكنك الإلغاء في أي وقت.',
    'plans', jsonb_build_array(
      jsonb_build_object('name', 'مجاني', 'desc', 'جرّب المنصة', 'price', '$0', 'features', jsonb_build_array('تصفح جميع الخدمات', 'توصيات AI أساسية', 'دعم عبر البريد الإلكتروني'), 'cta', 'ابدأ مجاناً'),
      jsonb_build_object('name', 'احترافي', 'desc', 'للمحترفين', 'price', '$49', 'features', jsonb_build_array('كل مميزات المجاني', 'مساعد AI متقدم', 'تحليلات متقدمة', 'دعم أولوية', 'سير عمل مخصص'), 'cta', 'ابدأ الآن'),
      jsonb_build_object('name', 'مؤسسات', 'desc', 'للفرق', 'price', '$199', 'features', jsonb_build_array('كل مميزات الاحترافي', 'أعضاء فريق غير محدودين', 'وصول API', 'دعم مخصص', 'تكاملات مخصصة', 'ضمان SLA'), 'cta', 'تواصل معنا')
    )
  ), jsonb_build_object(
    'title', 'Simple, transparent pricing',
    'subtitle', 'No hidden fees. No commitments. Cancel anytime.',
    'plans', jsonb_build_array(
      jsonb_build_object('name', 'Free', 'desc', 'Try it out', 'price', '$0', 'features', jsonb_build_array('Browse all services', 'Basic AI recommendations', 'Email support'), 'cta', 'Start for free'),
      jsonb_build_object('name', 'Pro', 'desc', 'For professionals', 'price', '$49', 'features', jsonb_build_array('Everything in Free', 'Priority AI assistant', 'Advanced analytics', 'Priority support', 'Custom workflows'), 'cta', 'Get started'),
      jsonb_build_object('name', 'Enterprise', 'desc', 'For teams', 'price', '$199', 'features', jsonb_build_array('Everything in Pro', 'Unlimited team members', 'API access', 'Dedicated support', 'Custom integrations', 'SLA guarantee'), 'cta', 'Contact us')
    )
  )),
  ('cta', jsonb_build_object(
    'title', 'هل أنت مستعد لتطوير طريقة عملك؟',
    'subtitle', 'أخبرنا عن مشروعك والمهام التي تريد تحسينها، وسنساعدك على تحديد الحل الذكي المناسب للبدء.',
    'button', 'لنبدأ ببناء الحل المناسب',
    'brandLabel', 'وكلاء الذكاء الاصطناعي • الأتمتة • القوة العاملة الرقمية'
  ), jsonb_build_object(
    'title', 'Ready to upgrade the way you work?',
    'subtitle', 'Tell us about your project and the tasks you want to improve, and we will help you find the right smart solution to get started.',
    'button', 'Let''s build the right solution',
    'brandLabel', 'AI Agents • Automation • Digital Workforce'
  )),
  ('footer', jsonb_build_object(
    'tagline', 'ابنِ بذكاء أكبر، وانمُ بسرعة أكبر.',
    'quickLinks', 'روابط سريعة',
    'services', 'الخدمات',
    'support', 'الدعم',
    'contactUs', 'تواصل معنا',
    'rights', 'جميع الحقوق محفوظة',
    'privacy', 'سياسة الخصوصية',
    'terms', 'شروط الاستخدام',
    'newsletterTitle', 'ابقَ على اطلاع',
    'newsletterDesc', 'احصل على آخر أخبار وتحديثات الذكاء الاصطناعي',
    'newsletterPlaceholder', 'أدخل بريدك الإلكتروني',
    'newsletterCta', 'اشترك'
  ), jsonb_build_object(
    'tagline', 'Build smarter, grow faster.',
    'quickLinks', 'Quick Links',
    'services', 'Services',
    'support', 'Support',
    'contactUs', 'Contact Us',
    'rights', 'All rights reserved',
    'privacy', 'Privacy Policy',
    'terms', 'Terms of Service',
    'newsletterTitle', 'Stay Updated',
    'newsletterDesc', 'Get the latest AI news and updates',
    'newsletterPlaceholder', 'Enter your email',
    'newsletterCta', 'Subscribe'
  ))
on conflict (key) do nothing;-- ============================================================
-- Blog tables for public articles / announcements
-- ============================================================

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text not null,
  title_en text not null,
  excerpt_ar text,
  excerpt_en text,
  content_ar text,
  content_en text,
  cover_image_url text,
  tags jsonb not null default '[]'::jsonb,
  author_name text,
  reading_minutes integer not null default 5,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);
create index if not exists blog_posts_is_published_idx
  on public.blog_posts (is_published);

-- ---------- updated_at trigger ----------
drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.blog_posts enable row level security;

-- public: read published posts only
drop policy if exists "blog_posts_select_public" on public.blog_posts;
create policy "blog_posts_select_public" on public.blog_posts
  for select to anon, authenticated
  using (is_published = true);

-- admin: full access
drop policy if exists "blog_posts_admin_all" on public.blog_posts;
create policy "blog_posts_admin_all" on public.blog_posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
-- ============================================================
-- Seed data — EDITABLE
-- NOTE: All prices below are PLACEHOLDERS for demonstration.
-- Edit them to your real prices before going live.
-- Safe to re-run: rows are upserted by slug / label.
-- ============================================================

-- ---------- Categories ----------
insert into public.categories (slug, name_ar, name_en, description_ar, description_en, icon, sort_order, is_active)
values
  ('whatsapp-messaging', 'واتساب والمراسلة', 'WhatsApp & Messaging', 'ردود تلقائية على واتساب وإنستغرام وتيليغرام لخدمة عملائك أسرع.', 'Auto-replies on WhatsApp, Instagram and Telegram to serve customers faster.', 'message-circle', 1, true),
  ('ai-agents', 'الوكلاء الأذكياء', 'AI Agents', 'وكلاء ذكاء اصطناعي للدعم والمبيعات وخدمة الزوار على موقعك.', 'AI agents for support, sales and website visitors.', 'bot', 2, true),
  ('content-design', 'المحتوى والتصميم', 'Content & Design Agents', 'وكيل محتوى لمنصات التواصل وحزم تصميم متوافقة مع هويتك.', 'Social content agent and brand-consistent design packs.', 'sparkles', 3, true),
  ('marketing', 'التسويق', 'Marketing', 'أتمتة التسويق وأفكار الحملات الإعلانية ونصوصها.', 'Marketing automation, campaign ideas and ad copy.', 'megaphone', 4, true),
  ('automation', 'الأتمتة (n8n/Make)', 'Automation (n8n/Make)', 'ربط أنظمتك وأتمتة الطلبات والفواتير والتذكيرات.', 'Connect your stack — orders, invoices and reminders on autopilot.', 'workflow', 5, true),
  ('custom', 'حلول مخصصة', 'Custom Solutions', 'وكيل ذكاء اصطناعي مبني حسب مواصفاتك بالضبط.', 'An AI agent built exactly to your specification.', 'code', 6, true)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  icon = excluded.icon,
  sort_order = excluded.sort_order;

-- ---------- Services ----------
with cat as (
  select slug, id from public.categories
)
insert into public.services (
  slug, category_id, title_ar, title_en,
  short_desc_ar, short_desc_en,
  description_ar, description_en,
  price, currency, price_type, delivery_days, revisions,
  features_ar, features_en, requirements_ar, requirements_en, faqs,
  is_featured, is_active, sort_order
)
select
  s.slug,
  cat.id,
  s.title_ar, s.title_en,
  s.short_desc_ar, s.short_desc_en,
  s.description_ar, s.description_en,
  s.price, 'USD', s.price_type::public.price_type, s.delivery_days, s.revisions,
  s.features_ar::jsonb, s.features_en::jsonb, s.requirements_ar::jsonb, s.requirements_en::jsonb, s.faqs::jsonb,
  s.is_featured, true, s.sort_order
from (values
  -- 1. WhatsApp auto-reply bot
  ('whatsapp-auto-reply-bot', 'whatsapp-messaging',
    'روبوت ردود تلقائية على واتساب لأعمالك', 'WhatsApp Auto-Reply Bot for Business',
    'رد فوري على عملائك على واتساب على مدار الساعة مع تحويل المحادثات لفريقك عند الحاجة.',
    'Instant WhatsApp replies around the clock, with smart handoff to your team.',
    E'# روبوت واتساب الذكي لخدمة عملائك\n\nييجنت موظفين يرد على عملائك على واتساب فوراً: يستقبل الرسائل، يجيب على الأسئلة الشائعة، يلتقط بيانات العميل (الاسم، الطلب، رقم التواصل) ويحوّل المحادثة لفريقك عندما تحتاج تدخلاً بشرياً.\n\n## كيف يعمل؟\n- يرد خلال ثوانٍ على أي رسالة واردة\n- يفهم اللهجة العربية والإنجليزية\n- يسجّل بيانات العملاء المحتملين تلقائياً\n- يعمل 24/7 دون انقطاع\n\n## ماذا تستلم؟\n- روبوت جاهز على رقم واتساب أعمالك\n- لوحة ردود قابلة للتعديل (نصوص، أسئلة شائعة)\n- تقرير أسبوعي بأهم الأسئلة والعملاء المحتملين\n- شرح استخدام ودعم لمدة شهر',
    E'# WhatsApp bot for customer service\n\nYour AI teammate replies to customers on WhatsApp instantly: handles incoming messages, answers FAQs, captures lead details (name, request, contact) and hands off to your team when a human is needed.\n\n## How it works\n- Replies within seconds to any message\n- Understands Arabic dialects and English\n- Captures leads automatically\n- Works 24/7\n\n## What you get\n- A ready bot on your WhatsApp Business number\n- Editable reply board (texts, FAQs)\n- Weekly report with top questions and leads\n- Usage guide + 1 month of support',
    150, 'one_time', 5, 2,
    '["ردود تلقائية على الرسائل الواردة", "كتالوج أسئلة شائعة قابل للتعديل", "استخراج بيانات العملاء المحتملين", "تحويل المحادثة لفريقك عند الحاجة", "تقرير أسبوعي", "دعم لمدة شهر بعد التسليم"]',
    '["Auto-replies to incoming messages", "Editable FAQ catalog", "Lead capture", "Human handoff to your team", "Weekly report", "1 month of post-delivery support"]',
    '["رقم واتساب أعمال (واتساب بزنس)", "قائمة الأسئلة والأجوبة الشائعة", "معلومات عن منتجاتك/خدماتك وأسعارك", "من تريد أن تصلك المحادثات الحساسة"]',
    '["Your WhatsApp Business number", "List of FAQs", "Your products/services and prices", "Where sensitive chats should be handed off"]',
    '[{"q_ar":"هل أحتاج رقم واتساب أعمال؟","a_ar":"نعم، رقم واتساب بزنس أو رقم عادي مع واتساب. نساعدك في الإعداد.","q_en":"Do I need WhatsApp Business?","a_en":"Yes — WhatsApp Business or a regular number with WhatsApp. We help you set it up."},{"q_ar":"هل يتوقف الرد التلقائي عن العمل أحياناً؟","a_ar":"الروبوت يعمل على خوادم موثوقة مع مراقبة مستمرة، ونعيد تشغيله مجاناً خلال فترة الدعم.","q_en":"Can the bot go offline?","a_en":"It runs on monitored reliable servers, and we restart it for free during the support period."}]',
    true, 1),

  -- 2. Instagram DM auto-reply
  ('instagram-dm-auto-reply', 'whatsapp-messaging',
    'رد تلقائي على رسائل إنستغرام', 'Instagram DM Auto-Reply',
    'ردود فورية على رسائل إنستغرام والتعليقات لتلتقط كل عميل مهتم قبل أن يضيع.',
    'Instant replies to Instagram DMs and comments — never lose an interested customer.',
    E'# وكيل إنستغرام للرد التلقائي\n\nييجنت موظفين يرد على الرسائل المباشرة والتعليقات على إنستغرام: يجيب على الأسئلة الشائعة، يوجه العميل لصفحة الطلب أو رابط الدفع، ويجمع قائمة العملاء المهتمين.\n\n## المميزات الرئيسية\n- رد تلقائي فوري على الرسائل والتعليقات\n- ردود مخصصة حسب الكلمات المفتاحية\n- توجيه للعملاء للروابط والطلبات\n- ملخص أسبوعي بالعملاء المهتمين',
    E'# Instagram auto-reply agent\n\nYour AI teammate replies to DMs and comments on Instagram: answers FAQs, directs customers to your order or payment link, and collects interested leads.\n\n## Highlights\n- Instant auto-replies to DMs and comments\n- Keyword-based custom replies\n- Drives customers to links and orders\n- Weekly summary of interested leads',
    120, 'one_time', 4, 2,
    '["رد تلقائي على الرسائل المباشرة", "ردود على التعليقات العامة", "ردود بالكلمات المفتاحية", "روابط الطلب والدفع", "ملخص أسبوعي"]',
    '["Auto-replies to DMs", "Comment replies", "Keyword-based replies", "Order & payment links", "Weekly summary"]',
    '["حساب إنستغرام (أعمال أو منشئ)", "صلاحيات الدخول أو ربط الحساب", "قائمة الأسئلة الشائعة", "روابط الطلب/الدفع"]',
    '["Instagram account (business or creator)", "Login access or account linking", "FAQ list", "Order/payment links"]',
    '[{"q_ar":"هل يعمل مع الحسابات الشخصية؟","a_ar":"الأفضل حساب أعمال أو منشئ محتوى للحصول على كامل المميزات.","q_en":"Does it work with personal accounts?","a_en":"A business or creator account unlocks the full features."}]',
    false, 2),

  -- 3. Telegram support bot
  ('telegram-support-bot', 'whatsapp-messaging',
    'بوت دعم على تيليغرام', 'Telegram Support Bot',
    'بوت تيليغرام يرد على استفسارات عملائك ويحوّلهم لفريق الدعم عند الحاجة.',
    'A Telegram bot that answers customer questions and routes them to support.',
    E'# بوت دعم تيليغرام\n\nبوت ذكي على تيليغرام لخدمة عملائك: يرد على الأسئلة الشائعة، يدعم الأوامر (/start، /help، /order)، ويحوّل المحادثة لفريقك.\n\n## المميزات\n- ردود فورية بالعربية والإنجليزية\n- أزرار وأوامر تفاعلية\n- توجيه للفريق البشري\n- لوحة إحصاءات بسيطة',
    E'# Telegram support bot\n\nA smart Telegram bot for customer service: answers FAQs, supports commands (/start, /help, /order) and hands off to your team.\n\n## Features\n- Instant replies in Arabic and English\n- Interactive buttons and commands\n- Human handoff\n- Simple analytics dashboard',
    100, 'one_time', 3, 2,
    '["ردود فورية", "أوامر وأزرار تفاعلية", "تحويل للفريق البشري", "إحصاءات استخدام", "دعم لمدة شهر"]',
    '["Instant replies", "Commands and buttons", "Human handoff", "Usage analytics", "1 month support"]',
    '["بوت تيليغرام (BotFather token)", "قائمة الأسئلة الشائعة", "قناة/مجموعة الدعم إن وجدت"]',
    '["Telegram bot token (BotFather)", "FAQ list", "Support channel/group if any"]',
    '[{"q_ar":"كم يستغرق الإعداد؟","a_ar":"غالباً يومان بعد استلام التوكن والأسئلة.","q_en":"How long is setup?","a_en":"Usually 2 days after we get the token and FAQs."}]',
    false, 3),

  -- 4. Customer support AI agent
  ('customer-support-ai-agent', 'ai-agents',
    'وكيل دعم عملاء ذكي (مدرب على أسئلتك)', 'Customer Support AI Agent',
    'وكيل ذكاء اصطناعي يدرب على أسئلتك وكتالوج منتجاتك ليجيب عملاءك بدقة.',
    'An AI agent trained on your FAQ and catalog to answer customers accurately.',
    E'# وكيل دعم مدرّب على نشاطك\n\nلا نعطيك روبوتاً جاهزاً للجميع، بل ندرّب وكيل ذكاء اصطناعي على أسئلة عملائك الحقيقية، ومنتجاتك، وسياساتك (الشحن، الاسترجاع، الأسعار).\n\n## آلية العمل\n1. نجمع قاعدة المعرفة: الأسئلة، الأجوبة، الكتالوج، السياسات\n2. نبني الوكيل ونختبره مع حالات حقيقية\n3. نربطه بقنواتك (الموقع، واتساب، البريد)\n4. نراقب الأداء أسبوعياً ونحسّن الإجابات\n\n## ماذا تستلم؟\n- وكيل دعم جاهز على القنوات المطلوبة\n- قاعدة معرفة منظمة وقابلة للتطوير\n- تقرير أداء شهري\n- تدريب لفريقك على الإدارة',
    E'# An agent trained on your business\n\nNot a generic bot — we train an AI agent on your real customer questions, products and policies (shipping, refunds, pricing).\n\n## Process\n1. Collect the knowledge base: Q&A, catalog, policies\n2. Build and test the agent with real cases\n3. Connect it to your channels (site, WhatsApp, email)\n4. Monitor weekly and improve answers\n\n## What you get\n- A ready agent on your chosen channels\n- An organized, extensible knowledge base\n- Monthly performance report\n- Team training on management',
    350, 'one_time', 8, 2,
    '["بناء قاعدة معرفة كاملة", "تدريب الوكيل على حالاتك الحقيقية", "ربط بقناتين على الأقل", "اختبارات جودة قبل التسليم", "تقرير أداء شهري", "دعم وتحسين لمدة شهر"]',
    '["Full knowledge base build", "Training on your real cases", "Connect to at least 2 channels", "Quality tests before delivery", "Monthly performance report", "1 month of support and tuning"]',
    '["أسئلة وأجوبة العملاء الشائعة (أو سجل محادثات)", "كتالوج المنتجات/الخدمات والأسعار", "سياسات الشحن والاسترجاع", "نظام الدخول للقنوات المطلوبة"]',
    '["Customer FAQs (or chat logs)", "Product/service catalog and prices", "Shipping and refund policies", "Access to the target channels"]',
    '[{"q_ar":"هل يفهم اللهجة الفلسطينية/الخليجية؟","a_ar":"نعم، يتم تدريبه على اللهجات المستهدفة في جمهورك.","q_en":"Does it understand Gulf/Levantine dialects?","a_en":"Yes — it is trained on the dialects your audience uses."},{"q_ar":"ماذا لو لم يعرف الإجابة؟","a_ar":"يعتذر بلطف ويحوّل العميل لفريقك مع ملخص للمحادثة.","q_en":"What if it doesn''t know the answer?","a_en":"It politely apologizes and hands off to your team with a chat summary."}]',
    true, 4),

  -- 5. Sales AI agent
  ('sales-ai-agent', 'ai-agents',
    'وكيل مبيعات ذكي يؤهل العملاء المحتملين', 'Sales AI Agent',
    'وكيل يجيب عن الأسعار، يؤهل العملاء المحتملين، ويسلمهم لفريق المبيعات جاهزين للإغلاق.',
    'Qualifies leads, answers pricing questions and hands sales-ready customers to your team.',
    E'# وكيل مبيعات يعمل كعضو في فريقك\n\nييجنت موظفين للمبيعات يتحدث مع عملائك المحتملين، يجمع احتياجاتهم وميزانيتهم، يجيب عن أسئلة الأسعار والباقات، وينقل العميل "الساخن" لفريقك فوراً.\n\n## ما يفعله\n- يسأل الأسئلة الصحيحة لاكتشاف الاحتياج\n- يقترح الباقة المناسبة وفق إجابات العميل\n- يحجز موعد مكالمة أو زيارة لفريقك\n- يرسل ملخصاً كاملاً لكل عميل محتمل',
    E'# A sales agent that works as a teammate\n\nA sales AI teammate that talks to prospects, collects needs and budget, answers pricing and plan questions, and passes hot leads to your team instantly.\n\n## What it does\n- Asks the right discovery questions\n- Suggests the right plan based on answers\n- Books a call or visit for your team\n- Sends a full summary per lead',
    400, 'one_time', 8, 2,
    '["اكتشاف الاحتياج وتقييم العميل", "إجابات الأسعار والباقات", "حجز مواعيد", "ملخص لكل عميل محتمل", "تسليم سلس لفريق المبيعات", "دعم وتحسين لمدة شهر"]',
    '["Lead discovery and qualification", "Pricing and plan answers", "Appointment booking", "Summary per lead", "Smooth handoff to sales", "1 month of support and tuning"]',
    '["عروض الأسعار والباقات الحالية", "أسئلة التأهيل التي تريدها", "آلية حجز المواعيد (تقويم/واتساب)", "فريق المبيعات المسؤول عن المتابعة"]',
    '["Current pricing and plans", "Your qualification questions", "Booking method (calendar/WhatsApp)", "Sales team responsible for follow-up"]',
    '[{"q_ar":"هل يستبدل فريق المبيعات؟","a_ar":"لا، هو يهيئ العملاء ويؤهلهم، والإغلاق يبقى بشرياً.","q_en":"Does it replace the sales team?","a_en":"No — it prepares and qualifies leads; closing stays human."}]',
    true, 5),

  -- 6. Website chat agent
  ('website-chat-agent', 'ai-agents',
    'وكيل محادثة لموقعك الإلكتروني', 'Website Chat Agent',
    'دردشة ذكية على موقعك تجيب الزوار، تجمع العملاء المحتملين، وتدعم بلغتهم.',
    'Smart website chat that answers visitors, captures leads and speaks their language.',
    E'# دردشة موقع ذكية\n\nنضيف واجهة دردشة أنيقة لموقعك (تتوافق مع هوية موقعك) مدعومة بوكلاء ذكاء اصطناعي مدربين على محتوى موقعك وأسئلتك الشائعة.\n\n## المميزات\n- تصميم متوافق مع هوية موقعك\n- إجابات من محتوى موقعك مباشرة\n- استخراج بيانات العملاء (البريد/الهاتف)\n- يعمل بالعربية والإنجليزية\n- تقارير عن أكثر الأسئلة',
    E'# Smart website chat\n\nWe add an elegant chat widget (matched to your brand) powered by AI agents trained on your site content and FAQs.\n\n## Features\n- Design matched to your brand\n- Answers sourced from your site content\n- Lead capture (email/phone)\n- Arabic and English\n- Reports on top questions',
    280, 'one_time', 6, 2,
    '["ودجت دردشة مخصص لهوية موقعك", "تدريب على محتوى موقعك", "استخراج بيانات التواصل", "دعم العربية والإنجليزية", "لوحة تقارير", "دعم لمدة شهر"]',
    '["Branded chat widget", "Training on your site content", "Contact capture", "Arabic and English", "Reporting dashboard", "1 month support"]',
    '["رابط موقعك", "الصفحات المهمة (منتجات، أسعار، تواصل)", "هوية العلامة (الألوان/الشعار)", "مكان عرض النماذج المطلوبة"]',
    '["Your website URL", "Key pages (products, pricing, contact)", "Brand colors/logo", "Where captured leads should go"]',
    '[{"q_ar":"هل يعمل مع ووردبريس؟","a_ar":"نعم، تركيب بسيط عبر كود مدمج أو إضافة.","q_en":"Does it work with WordPress?","a_en":"Yes — simple embed code or a plugin."}]',
    false, 6),

  -- 7. Social media content agent
  ('social-content-agent', 'content-design',
    'وكيل محتوى لمنصات التواصل الاجتماعي', 'Social Media Content Agent',
    'تقويم محتوى شهري، نصوص منشورات، وهاشتاقات متوافقة مع علامتك.',
    'Monthly content calendar, captions and hashtags aligned with your brand.',
    E'# وكيل محتوى شهري\n\nنجهّز لك تقويم محتوى جاهزاً لشهر كامل: أفكار منشورات، نصوص جذابة بالعربية، هاشتاقات مدروسة، واقتراحات فيديو قصيرة.\n\n## كيف يعمل؟\n- نحلل علامتك ومنافسيك\n- نبني تقويم محتوى شهرياً (20-30 فكرة)\n- نكتب النصوص والهاشتاقات\n- نسلّمك كل شيء بملف منظم + تقويم تخطيط\n\n## المدة والدعم\n- تسليم كل شهر قبل بدايته بـ 5 أيام\n- جولتا تعديل على المحتوى',
    E'# Monthly content agent\n\nWe prepare a full month content calendar: post ideas, engaging Arabic captions, researched hashtags and short-form video suggestions.\n\n## How it works\n- Analyze your brand and competitors\n- Build a monthly calendar (20-30 ideas)\n- Write captions and hashtags\n- Deliver in an organized file + planning calendar\n\n## Timing\n- Delivered 5 days before each month starts\n- 2 revision rounds',
    200, 'monthly', 5, 2,
    '["تقويم محتوى شهري (20-30 فكرة)", "نصوص منشورات جاهزة", "هاشتاقات مدروسة", "أفكار فيديوهات قصيرة", "ملف منظم قابل للتعديل", "جولتا تعديل"]',
    '["Monthly calendar (20-30 ideas)", "Ready post captions", "Researched hashtags", "Short video ideas", "Organized editable file", "2 revision rounds"]',
    '["معلومات عن علامتك وجمهورك", "منافسون تراهم مرجعية", "قناة النشر (إنستغرام/تيك توك/فيسبوك)", "أمثلة على منشورات أعجبتك"]',
    '["Brand and audience info", "Reference competitors", "Publishing channels", "Examples of posts you like"]',
    '[{"q_ar":"هل تصمم الصور أيضاً؟","a_ar":"المحتوى النصي مشمول، والتصميم يُطلب كخدمة منفصلة أو إضافة.","q_en":"Does it include design?","a_en":"Text content is included; design is a separate service or add-on."}]',
    true, 7),

  -- 8. Brand-consistent post design pack
  ('brand-design-pack', 'content-design',
    'حزمة تصميم منشورات متوافقة مع هويتك', 'Brand-Consistent Post Design Pack',
    '10 تصاميم منشورات جاهزة بنفس الهوية البصرية لعلامتك.',
    '10 ready post designs aligned with your visual brand identity.',
    E'# حزمة تصميم الشهر\n\n10 تصاميم منشورات جاهزة للنشر مصممة بنفس الهوية البصرية لعلامتك: ألوانك، خطوطك، شعارك.\n\n## ما تستلمه\n- 10 تصاميم (مربع/أفقي/ستوري)\n- ملفات PNG عالية الجودة + مصدر قابل للتعديل\n- جولة تعديل واحدة\n- التسليم خلال 5 أيام عمل',
    E'# Monthly design pack\n\n10 ready-to-publish post designs in your visual identity: your colors, fonts and logo.\n\n## What you get\n- 10 designs (square / landscape / story)\n- High-res PNGs + editable source\n- 1 revision round\n- Delivered in 5 business days',
    120, 'one_time', 5, 1,
    '["10 تصاميم منشورات", "مقاسات متعددة (مربع، ستوري)", "ملفات PNG + المصدر", "جولة تعديل واحدة"]',
    '["10 post designs", "Multiple sizes (square, story)", "PNG + source files", "1 revision round"]',
    '["الشعار بصيغة عالية الجودة", "ألوان العلامة والخطوط", "نصوص المنشورات المراد تصميمها", "أمثلة تصاميم تعجبك"]',
    '["High-quality logo", "Brand colors and fonts", "Post copy to design", "Design examples you like"]',
    '[{"q_ar":"هل أستطيع التعديل على التصاميم لاحقاً؟","a_ar":"نعم، نسلّمك ملفات المصدر قابلة للتعديل.","q_en":"Can I edit the designs later?","a_en":"Yes, you get editable source files."}]',
    false, 8),

  -- 9. Marketing automation
  ('marketing-automation', 'marketing',
    'أتمتة التسويق: من العميل المحتمل إلى المتابعة', 'Marketing Automation: Lead to Follow-up',
    'ربط نماذج الالتقاط بـ CRM ورسائل المتابعة التلقائية.',
    'Connect lead capture forms to a CRM and automated follow-ups.',
    E'# أتمتة تسويق متكاملة\n\nنبني لك مساراً تلقائياً: العميل يملأ النموذج ← يُضاف تلقائياً إلى نظام إدارة العملاء ← يستقبل سلسلة رسائل متابعة ← يصلك إشعار عند تفاعله.\n\n## المكونات\n- نماذج التقاط عملاء\n- ربط مع CRM أو جوجل شيت\n- سلاسل متابعة بالبريد/واتساب\n- إشعارات لفريقك\n- لوحة متابعة بسيطة',
    E'# Complete marketing automation\n\nWe build an automated flow: lead fills a form → added to your CRM → receives a follow-up sequence → your team gets notified on engagement.\n\n## Components\n- Lead capture forms\n- CRM or Google Sheets integration\n- Email/WhatsApp follow-up sequences\n- Team notifications\n- Simple tracking dashboard',
    300, 'one_time', 7, 2,
    '["نماذج التقاط عملاء", "ربط مع CRM أو جداول", "سلسلة متابعة تلقائية", "إشعارات فورية للفريق", "لوحة متابعة"]',
    '["Lead capture forms", "CRM/Sheets integration", "Automated follow-up sequence", "Instant team alerts", "Tracking dashboard"]',
    '["نظام إدارة العملاء المستخدم", "قناة التواصل (بريد/واتساب)", "نصوص رسائل المتابعة أو أفكارها", "الميزانية الإعلانية إن وجدت"]',
    '["Your CRM system", "Contact channel (email/WhatsApp)", "Follow-up message copy or ideas", "Ad budget if any"]',
    '[{"q_ar":"هل تعمل الأتمتة مع أنظمتي الحالية؟","a_ar":"نعم، ندعم معظم الأنظمة الشائعة وندعمك في الربط.","q_en":"Does it work with my current tools?","a_en":"Yes — we support most common tools and help you connect them."}]',
    false, 9),

  -- 10. Ad copy and campaign ideas
  ('ad-copy-agent', 'marketing',
    'وكيل نصوص إعلانية وأفكار حملات', 'Ad Copy & Campaign Ideas Agent',
    'نصوص إعلانية جاهزة وأفكار حملات لفيسبوك وإنستغرام وتيك توك.',
    'Ready ad copy and campaign ideas for Facebook, Instagram and TikTok.',
    E'# وكيل الحملات الإعلانية\n\nنجهّز لك حملة إعلانية كاملة على الورق: فكرة الحملة، الجمهور المستهدف، النصوص الإعلانية (3-5 نسخ)، الصور المقترحة، والميزانية الموصى بها.\n\n## ما تستلمه\n- 3 أفكار حملات كاملة\n- 15 نصاً إعلانياً جاهزًا\n- تقسيم الجمهور المستهدف\n- توصيات الميزانية\n- جولة تعديل',
    E'# Campaign agent\n\nWe prepare a complete ad campaign on paper: campaign idea, target audience, ad copy (3-5 variants), creative direction and recommended budget.\n\n## What you get\n- 3 complete campaign ideas\n- 15 ready ad copies\n- Audience segmentation\n- Budget recommendations\n- 1 revision round',
    90, 'one_time', 3, 1,
    '["3 أفكار حملات", "15 نصاً إعلانياً", "تقسيم الجمهور", "توصيات الميزانية", "جولة تعديل"]',
    '["3 campaign ideas", "15 ad copies", "Audience segmentation", "Budget advice", "1 revision round"]',
    '["نشاطك والمنتج المروج", "الجمهور المستهدف", "المنصات الإعلانية", "ميزانية الحملة التقريبية"]',
    '["Your business and promoted product", "Target audience", "Ad platforms", "Approximate campaign budget"]',
    '[{"q_ar":"هل تنشئون الحملات على حسابي؟","a_ar":"الخدمة تشمل التخطيط والنصوص، وإنشاء الحملة يُطلب كإضافة.","q_en":"Do you launch campaigns on my account?","a_en":"This service covers planning and copy; launching is an add-on."}]',
    false, 10),

  -- 11. Order-to-sheet/CRM automation
  ('orders-automation', 'automation',
    'أتمتة الطلبات: من الموقع إلى الجدول أو CRM', 'Orders Automation: Site to Sheet/CRM',
    'كل طلب يصل إلى جدولك أو نظامك تلقائياً مع إشعارات فورية.',
    'Every order lands in your sheet or CRM automatically with instant alerts.',
    E'# أتمتة دورة الطلبات\n\nنبني مساراً يأخذ الطلبات من موقعك أو متجرك ويضيفها تلقائياً إلى جوجل شيت أو CRM، مع إشعارات واتساب/بريد لفريقك، وحالات الطلب تتحدث تلقائياً.\n\n## المكونات\n- استقبال الطلبات (الموقع/المتجر/الواتساب)\n- إضافة تلقائية للجدول أو CRM\n- إشعارات فورية\n- تحديث حالة الطلب\n- معالجة الأخطاء وإعادة المحاولة',
    E'# Order flow automation\n\nWe build a flow that takes orders from your site or store and adds them to Google Sheets or a CRM, with WhatsApp/email alerts and automatic status updates.\n\n## Components\n- Order intake (site/store/WhatsApp)\n- Automatic push to Sheet/CRM\n- Instant alerts\n- Order status updates\n- Error handling and retries',
    250, 'one_time', 6, 2,
    '["ربط مصدر الطلبات", "إضافة تلقائية للجدول/CRM", "إشعارات الفريق", "تحديث الحالات", "معالجة الأخطاء"]',
    '["Connect order source", "Auto-push to Sheet/CRM", "Team alerts", "Status updates", "Error handling"]',
    '["مصدر الطلبات (موقع/متجر/واتساب)", "نظام الوجهة (جوجل شيت أو CRM)", "حقول البيانات المطلوبة", "إشعارات مين تصلك"]',
    '["Order source (site/store/WhatsApp)", "Destination (Google Sheet or CRM)", "Required data fields", "Who should be notified"]',
    '[{"q_ar":"كم طلباً تتحمل الأتمتة شهرياً؟","a_ar":"حسب الباقة، وعادة تكفي الباقة القياسية لمئات الطلبات.","q_en":"How many orders per month?","a_en":"Depends on the plan — the standard one fits hundreds of orders."}]',
    true, 11),

  -- 12. Invoice and reminder automation
  ('invoice-reminder-automation', 'automation',
    'أتمتة الفواتير والتذكيرات', 'Invoice & Reminder Automation',
    'فواتير تُنشأ تلقائياً وتذكيرات دفع ذكية تقلل التأخير.',
    'Auto-generated invoices and smart payment reminders that reduce late payments.',
    E'# الفواتير والتذكيرات على التلقائي\n\nننشئ لك نظاماً يصدر الفواتير تلقائياً عند اكتمال الطلب أو الشهر، ويرسل تذكيرات دفع ذكية قبل وبعد الاستحقاق، مع ملخص شهري للمبالغ المستحقة.\n\n## المميزات\n- إصدار تلقائي للفواتير (PDF)\n- تذكيرات قبل/يوم/بعد الاستحقاق\n- ملخص شهري للمستحقات\n- ربط مع جداولك أو CRM',
    E'# Invoices and reminders on autopilot\n\nWe build a system that issues invoices automatically when an order or month completes, sends smart reminders before and after due dates, and provides a monthly receivables summary.\n\n## Features\n- Auto invoice generation (PDF)\n- Reminders before/on/after due date\n- Monthly receivables summary\n- Integrates with your sheets or CRM',
    180, 'one_time', 5, 2,
    '["إصدار الفواتير تلقائياً", "تذكيرات ذكية متعددة", "ملخص شهري للمستحقات", "ربط مع أنظمتك"]',
    '["Auto invoice generation", "Smart multi-stage reminders", "Monthly receivables summary", "Integrations"]',
    '["قالب الفاتورة الحالي", "بيانات العملاء", "مواعيد الاستحقاق المعتادة", "قناة إرسال التذكيرات"]',
    '["Your invoice template", "Customer data", "Usual due dates", "Reminder channel"]',
    '[{"q_ar":"هل تدعم الفواتير بالعربية؟","a_ar":"نعم، القوالب ثنائية اللغة حسب حاجتك.","q_en":"Are Arabic invoices supported?","a_en":"Yes — templates are bilingual as needed."}]',
    false, 12),

  -- 13. Custom AI agent
  ('custom-ai-agent', 'custom',
    'وكيل ذكاء اصطناعي مخصص حسب مواصفاتك', 'Custom AI Agent (Quote-based)',
    'فكرة خاصة؟ نبني لك وكيلاً مخصصاً بالمواصفات التي تحتاجها بالضبط.',
    'A unique idea? We build a custom agent to your exact specification.',
    E'# وكيل مخصص بالكامل\n\nعندما لا تجد ما تحتاجه في الكتالوج، نبني لك حلاً مخصصاً: من تحديد المتطلبات، إلى التصميم، البناء، الاختبار، والتسليم.\n\n## كيف نبدأ؟\n1. مكالمة قصيرة لفهم الفكرة\n2. عرض سعر ونطاق عمل واضح\n3. بناء على مراحل مع مراجعات\n4. تسليم مع توثيق وتدريب\n\n## السعر\nيبدأ من 500 دولار ويُحدد حسب النطاق.',
    E'# Fully custom agent\n\nWhen the catalog doesn''t cover your need, we build a custom solution: requirements, design, build, test and delivery.\n\n## How we start\n1. A short call to understand the idea\n2. A quote with clear scope\n3. Build in stages with reviews\n4. Delivery with docs and training\n\n## Pricing\nStarting from $500, scoped per project.',
    500, 'one_time', 15, 3,
    '["تحليل المتطلبات", "تصميم الحل", "البناء على مراحل", "اختبارات وتسليم", "توثيق وتدريب", "دعم بعد التسليم"]',
    '["Requirements analysis", "Solution design", "Staged build", "Testing and delivery", "Docs and training", "Post-delivery support"]',
    '["وصف الفكرة والمشكلة", "الأنظمة المطلوب ربطها", "الميزانية التقريبية", "الموعد المطلوب للتسليم"]',
    '["Idea and problem description", "Systems to integrate", "Approximate budget", "Required delivery date"]',
    '[{"q_ar":"هل يمكن البدء بمرحلة تجريبية؟","a_ar":"نعم، ندعم البناء على مراحل مع تسليم جزئي.","q_en":"Can we start with a pilot?","a_en":"Yes — staged delivery is supported."}]',
    false, 13)
) as s(slug, category_slug, title_ar, title_en, short_desc_ar, short_desc_en,
       description_ar, description_en, price, price_type, delivery_days, revisions,
       features_ar, features_en, requirements_ar, requirements_en, faqs,
       is_featured, sort_order)
join cat on cat.slug = s.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  short_desc_ar = excluded.short_desc_ar,
  short_desc_en = excluded.short_desc_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  price = excluded.price,
  price_type = excluded.price_type,
  delivery_days = excluded.delivery_days,
  revisions = excluded.revisions,
  features_ar = excluded.features_ar,
  features_en = excluded.features_en,
  requirements_ar = excluded.requirements_ar,
  requirements_en = excluded.requirements_en,
  faqs = excluded.faqs,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order;

-- ---------- Add-ons ----------
-- NOTE: add-on prices are PLACEHOLDERS — edit before launch.
insert into public.service_addons (service_id, title_ar, title_en, price, extra_days, is_active)
select s.id, a.title_ar, a.title_en, a.price, a.extra_days, true
from (values
  ('whatsapp-auto-reply-bot', 'ربط 3 ردود إضافية (أوامر متقدمة)', '3 extra reply flows (advanced commands)', 40, 1),
  ('whatsapp-auto-reply-bot', 'دعم أولوية لمدة 3 أشهر', '3 months priority support', 60, 0),
  ('customer-support-ai-agent', 'تدريب على 50 سؤالاً إضافياً', 'Training on 50 extra questions', 80, 2),
  ('customer-support-ai-agent', 'ربط قناة إضافية (بريد/تيليغرام)', 'Extra channel (email/Telegram)', 70, 2),
  ('sales-ai-agent', 'ربط مع نظام CRM', 'CRM integration', 90, 2),
  ('website-chat-agent', 'تصميم ودجت مخصص بالكامل', 'Fully custom widget design', 60, 2),
  ('social-content-agent', 'تصميم 10 منشورات إضافية', '10 extra post designs', 100, 3),
  ('brand-design-pack', '5 تصاميم إضافية', '5 extra designs', 50, 2),
  ('marketing-automation', 'سلاسل متابعة إضافية (5 رسائل)', 'Extra follow-up sequence (5 messages)', 60, 2),
  ('custom-ai-agent', 'مرحلة تجريبية أولى', 'Initial pilot phase', 250, 5)
) as a(service_slug, title_ar, title_en, price, extra_days)
join public.services s on s.slug = a.service_slug
where not exists (
  select 1 from public.service_addons existing
  where existing.service_id = s.id and existing.title_en = a.title_en
);

-- ---------- Payment methods ----------
-- NOTE: replace the details below with your real bank / wallet information.
insert into public.payment_methods (type, label_ar, label_en, details_ar, details_en, is_active, sort_order)
values
  ('manual', 'تحويل بنكي', 'Bank transfer',
   E'**بنك فلسطين**\nاسم الحساب: اسم شركتك\nرقم الحساب: 0000-0000-0000-0000\nIBAN: PS00 0000 0000 0000 0000 0000 0000\n\nيرجى إرسال صورة إيصال التحويل من صفحة الطلب.',
   E'**Bank of Palestine**\nAccount name: Your Company\nAccount number: 0000-0000-0000-0000\nIBAN: PS00 0000 0000 0000 0000 0000 0000\n\nPlease upload a transfer receipt from the order page.',
   true, 1),
  ('manual', 'محفظة إلكترونية (جوال)', 'Mobile wallet',
   E'**محفظة جوال / إم تي إن**\nرقم المحفظة: 0599 000 000\nاسم المستلم: اسم شركتك\n\nأرسل صورة إثبات التحويل من صفحة الطلب.',
   E'**Mobile wallet**\nWallet number: 0599 000 000\nRecipient: Your Company\n\nUpload the transfer proof from the order page.',
   true, 2),
  ('manual', 'دفع نقدي في المكتب', 'Cash / office',
   E'**الدفع النقدي**\nيمكنك زيارة مكتبنا ودفع المبلغ نقداً واستلام فاتورة.\nالعنوان: غزة، فلسطين\nالدوام: 9 صباحاً - 5 مساءً',
   E'**Cash payment**\nVisit our office to pay in cash and receive a receipt.\nAddress: Gaza, Palestine\nHours: 9 AM - 5 PM',
   true, 3)
on conflict do nothing;

-- ============================================================
-- الخطوة الأخيرة (يدوية): ترقية أول مستخدم إلى مدير (admin)
-- 1) سجّل أولاً من الموقع بالبريد الذي تريده
-- 2) استبدل البريد في الأسطر التالية (ثلاثة مواضع لكلمة you@example.com)
-- 3) نفّذ الأسطر الثلاثة التالية كاملة في SQL Editor
-- (تعطيل الحماية مؤقتاً مطلوب لأن SQL Editor لا يحتوي جلسة دخول)
-- ============================================================
alter table public.profiles disable trigger profiles_prevent_role_escalation;

update public.profiles
  set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');

alter table public.profiles enable trigger profiles_prevent_role_escalation;
