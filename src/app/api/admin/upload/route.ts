import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
const MAX_SIZE = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`admin-upload:${ip}`, rateLimits.upload.limit, rateLimits.upload.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const admin = createAdminClient();
  const ext = file.type.split('/')[1] ?? 'png';
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from('service-covers')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[admin/upload] failed', uploadError);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('service-covers').getPublicUrl(path);

  return NextResponse.json({ path, url: publicUrl });
}
