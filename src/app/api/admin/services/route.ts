import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const t = (key: string) => key;
const schemas = createAdminSchemas(t);

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
  const limit = rateLimit(`admin-service:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schemas.serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createAdminClient();

  const { data: service, error } = await admin
    .from('services')
    .insert({
      slug: input.slug,
      category_id: input.categoryId ?? null,
      title_ar: input.titleAr,
      title_en: input.titleEn,
      short_desc_ar: input.shortDescAr ?? null,
      short_desc_en: input.shortDescEn ?? null,
      description_ar: input.descriptionAr ?? null,
      description_en: input.descriptionEn ?? null,
      price: input.price,
      currency: input.currency,
      price_type: input.priceType,
      delivery_days: input.deliveryDays,
      revisions: input.revisions,
      features_ar: input.featuresAr as unknown as never,
      features_en: input.featuresEn as unknown as never,
      requirements_ar: input.requirementsAr as unknown as never,
      requirements_en: input.requirementsEn as unknown as never,
      faqs: input.faqs as unknown as never,
      cover_image_url: input.coverImageUrl ?? null,
      is_featured: input.isFeatured,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .select('id')
    .single();

  if (error || !service) {
    console.error('[admin/services] insert failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const activeAddons = input.addons.filter((a) => !a.deleted);
  if (activeAddons.length > 0) {
    await admin.from('service_addons').insert(
      activeAddons.map((addon) => ({
        service_id: service.id,
        title_ar: addon.titleAr,
        title_en: addon.titleEn,
        price: addon.price,
        extra_days: addon.extraDays,
        is_active: addon.isActive,
      }))
    );
  }

  return NextResponse.json({ id: service.id });
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`admin-service:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schemas.serviceSchema.extend({ id: z.string().uuid() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createAdminClient();

  const { error } = await admin
    .from('services')
    .update({
      slug: input.slug,
      category_id: input.categoryId ?? null,
      title_ar: input.titleAr,
      title_en: input.titleEn,
      short_desc_ar: input.shortDescAr ?? null,
      short_desc_en: input.shortDescEn ?? null,
      description_ar: input.descriptionAr ?? null,
      description_en: input.descriptionEn ?? null,
      price: input.price,
      currency: input.currency,
      price_type: input.priceType,
      delivery_days: input.deliveryDays,
      revisions: input.revisions,
      features_ar: input.featuresAr as unknown as never,
      features_en: input.featuresEn as unknown as never,
      requirements_ar: input.requirementsAr as unknown as never,
      requirements_en: input.requirementsEn as unknown as never,
      faqs: input.faqs as unknown as never,
      cover_image_url: input.coverImageUrl ?? null,
      is_featured: input.isFeatured,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq('id', input.id);

  if (error) {
    console.error('[admin/services] update failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // Sync add-ons: update existing, insert new, delete removed.
  const existingAddons = input.addons.filter((a) => a.id && !a.deleted);
  const newAddons = input.addons.filter((a) => !a.id && !a.deleted);
  const deletedIds = input.addons.filter((a) => a.id && a.deleted).map((a) => a.id!);

  if (existingAddons.length > 0) {
    for (const addon of existingAddons) {
      await admin
        .from('service_addons')
        .update({
          title_ar: addon.titleAr,
          title_en: addon.titleEn,
          price: addon.price,
          extra_days: addon.extraDays,
          is_active: addon.isActive,
        })
        .eq('id', addon.id!)
        .eq('service_id', input.id);
    }
  }

  if (newAddons.length > 0) {
    await admin.from('service_addons').insert(
      newAddons.map((addon) => ({
        service_id: input.id,
        title_ar: addon.titleAr,
        title_en: addon.titleEn,
        price: addon.price,
        extra_days: addon.extraDays,
        is_active: addon.isActive,
      }))
    );
  }

  if (deletedIds.length > 0) {
    await admin.from('service_addons').delete().in('id', deletedIds);
  }

  return NextResponse.json({ ok: true });
}
