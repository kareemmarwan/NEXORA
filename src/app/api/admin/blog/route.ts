import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schemas = createAdminSchemas((key) => key);

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request, 'blog');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = schemas.blogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('blog_posts')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'slug_taken' }, { status: 400 });
  }

  const { data: post, error } = await admin
    .from('blog_posts')
    .insert({
      slug: input.slug,
      title_ar: input.titleAr,
      title_en: input.titleEn,
      excerpt_ar: input.excerptAr ?? null,
      excerpt_en: input.excerptEn ?? null,
      content_ar: input.contentAr ?? null,
      content_en: input.contentEn ?? null,
      cover_image_url: input.coverImageUrl ?? null,
      tags: input.tags as unknown as never,
      author_name: input.authorName ?? null,
      reading_minutes: input.readingMinutes,
      is_published: input.isPublished,
      published_at: input.isPublished ? (input.publishedAt ?? new Date().toISOString()) : null,
    })
    .select('id')
    .single();

  if (error || !post) {
    console.error('[admin/blog] insert failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ id: post.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await guardAdminApi(request, 'blog');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = schemas.blogPostSchema.extend({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('blog_posts')
    .select('id')
    .eq('slug', input.slug)
    .neq('id', input.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'slug_taken' }, { status: 400 });
  }

  const { error } = await admin
    .from('blog_posts')
    .update({
      slug: input.slug,
      title_ar: input.titleAr,
      title_en: input.titleEn,
      excerpt_ar: input.excerptAr ?? null,
      excerpt_en: input.excerptEn ?? null,
      content_ar: input.contentAr ?? null,
      content_en: input.contentEn ?? null,
      cover_image_url: input.coverImageUrl ?? null,
      tags: input.tags as unknown as never,
      author_name: input.authorName ?? null,
      reading_minutes: input.readingMinutes,
      is_published: input.isPublished,
      published_at: input.isPublished
        ? (input.publishedAt ?? new Date().toISOString())
        : null,
    })
    .eq('id', input.id);

  if (error) {
    console.error('[admin/blog] update failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await guardAdminApi(request, 'blog');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('blog_posts').delete().eq('id', parsed.data.id);
  if (error) {
    console.error('[admin/blog] delete failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
