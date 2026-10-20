import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';
import { MEDIA_BUCKET, getAdminMediaFiles } from '@/lib/data/admin';

export const dynamic = 'force-dynamic';

const deleteSchema = z.object({ path: z.string().trim().min(1).max(500) });

export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request, 'media');
  if (!guard.ok) return guard.response;

  try {
    const files = await getAdminMediaFiles();
    return NextResponse.json({ files });
  } catch (error) {
    console.error('[admin/media] list failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await guardAdminApi(request, 'media');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(MEDIA_BUCKET).remove([parsed.data.path]);

  if (error) {
    console.error('[admin/media] delete failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
