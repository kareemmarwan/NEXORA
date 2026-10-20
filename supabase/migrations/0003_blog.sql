-- ============================================================
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
