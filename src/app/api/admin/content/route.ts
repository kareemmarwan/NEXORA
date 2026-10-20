import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';

export const dynamic = 'force-dynamic';

const settingSchema = z.object({
  type: z.literal('setting'),
  key: z.string().min(1).max(100),
  valueAr: z.string(),
  valueEn: z.string(),
});

const contentSchema = z.object({
  type: z.literal('content'),
  key: z.string().min(1).max(100),
  contentAr: z.record(z.unknown()),
  contentEn: z.record(z.unknown()),
});

const bulkSchema = z.object({
  settings: z.array(settingSchema).optional(),
  contents: z.array(contentSchema).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request, 'content');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];

  if (parsed.data.settings && parsed.data.settings.length > 0) {
    for (const setting of parsed.data.settings) {
      const { error } = await admin
        .from('site_settings')
        .upsert(
          { key: setting.key, value_ar: setting.valueAr, value_en: setting.valueEn },
          { onConflict: 'key' }
        );
      if (error) errors.push(`setting:${setting.key}`);
    }
  }

  if (parsed.data.contents && parsed.data.contents.length > 0) {
    for (const content of parsed.data.contents) {
      const { error } = await admin
        .from('site_content')
        .upsert(
          {
            key: content.key,
            content_ar: content.contentAr as import('@/types/database').Json,
            content_en: content.contentEn as import('@/types/database').Json,
          },
          { onConflict: 'key' }
        );
      if (error) errors.push(`content:${content.key}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'db_error', failed: errors }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}