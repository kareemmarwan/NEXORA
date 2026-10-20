import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schemas = createAdminSchemas((key) => key);

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request, 'docs');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = schemas.docsSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('site_content')
    .upsert(
      {
        key: 'docs',
        content_ar: parsed.data as unknown as import('@/types/database').Json,
        content_en: parsed.data as unknown as import('@/types/database').Json,
      },
      { onConflict: 'key' }
    );

  if (error) {
    console.error('[admin/docs] save failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
