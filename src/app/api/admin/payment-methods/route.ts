import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schemas = createAdminSchemas((key) => key);

async function requireAdminUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user : null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`admin-pm:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const adminUser = await requireAdminUser();
  if (!adminUser) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schemas.paymentMethodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('payment_methods')
    .insert({
      type: parsed.data.type,
      label_ar: parsed.data.labelAr,
      label_en: parsed.data.labelEn,
      details_ar: parsed.data.detailsAr ?? null,
      details_en: parsed.data.detailsEn ?? null,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`admin-pm:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const adminUser = await requireAdminUser();
  if (!adminUser) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schemas.paymentMethodSchema.extend({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const { error } = await admin
    .from('payment_methods')
    .update({
      type: rest.type,
      label_ar: rest.labelAr,
      label_en: rest.labelEn,
      details_ar: rest.detailsAr ?? null,
      details_en: rest.detailsEn ?? null,
      sort_order: rest.sortOrder,
      is_active: rest.isActive,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdminUser();
  if (!adminUser) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('payment_methods').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
