import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schemas = createAdminSchemas((key) => key);

export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request, 'cat');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = schemas.categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('categories')
    .insert({
      slug: parsed.data.slug,
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      description_ar: parsed.data.descriptionAr ?? null,
      description_en: parsed.data.descriptionEn ?? null,
      icon: parsed.data.icon ?? null,
      sort_order: parsed.data.sortOrder,
      is_active: parsed.data.isActive,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: NextRequest) {
  const guard = await guardAdminApi(request, 'cat');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = schemas.categorySchema.extend({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const { id, ...rest } = parsed.data;
  const { error } = await admin
    .from('categories')
    .update({
      slug: rest.slug,
      name_ar: rest.nameAr,
      name_en: rest.nameEn,
      description_ar: rest.descriptionAr ?? null,
      description_en: rest.descriptionEn ?? null,
      icon: rest.icon ?? null,
      sort_order: rest.sortOrder,
      is_active: rest.isActive,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await guardAdminApi(request, 'cat');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const admin = createAdminClient();

  const { count } = await admin
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', parsed.data.id);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'category_has_services' }, { status: 400 });
  }

  const { error } = await admin.from('categories').delete().eq('id', parsed.data.id);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
