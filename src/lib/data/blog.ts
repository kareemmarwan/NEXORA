import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { DEMO_BLOG_POSTS } from '@/lib/data/demo';
import type { BlogPost } from '@/types/database';

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export interface BlogFilters {
  search?: string | null;
  tag?: string | null;
  page?: number;
  pageSize?: number;
}

export interface BlogResult {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export const getPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  if (!supabaseConfigured()) {
    return DEMO_BLOG_POSTS.filter((p) => p.is_published);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return data ?? [];
});

export const getBlog = cache(async (filters: BlogFilters): Promise<BlogResult> => {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, filters.pageSize ?? 9));

  let posts = (await getPublishedPosts()).filter((p) => p.is_published);

  if (filters.tag) {
    posts = posts.filter((p) => {
      const tags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
      return tags.includes(filters.tag!);
    });
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title_ar.toLowerCase().includes(term) ||
        p.title_en.toLowerCase().includes(term) ||
        (p.excerpt_ar ?? '').toLowerCase().includes(term) ||
        (p.excerpt_en ?? '').toLowerCase().includes(term)
    );
  }

  posts.sort((a, b) => {
    const aDate = a.published_at ?? a.created_at;
    const bDate = b.published_at ?? b.created_at;
    return bDate.localeCompare(aDate);
  });

  const total = posts.length;
  const from = (page - 1) * pageSize;
  return {
    posts: posts.slice(from, from + pageSize),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  if (!supabaseConfigured()) {
    return DEMO_BLOG_POSTS.find((p) => p.slug === slug && p.is_published) ?? null;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !data) return null;
  return data;
});

export const getRelatedPosts = cache(
  async (currentSlug: string, tags: string[], limit = 3): Promise<BlogPost[]> => {
    const posts = (await getPublishedPosts()).filter((p) => p.slug !== currentSlug);
    const withTags = posts.filter((p) => {
      const postTags = Array.isArray(p.tags) ? (p.tags as string[]) : [];
      return postTags.some((t) => tags.includes(t));
    });
    return (withTags.length > 0 ? withTags : posts).slice(0, limit);
  }
);

export const getBlogTags = cache(async (): Promise<string[]> => {
  const posts = await getPublishedPosts();
  const tags = new Set<string>();
  for (const post of posts) {
    if (Array.isArray(post.tags)) {
      for (const tag of post.tags as string[]) tags.add(tag);
    }
  }
  return Array.from(tags).sort();
});
