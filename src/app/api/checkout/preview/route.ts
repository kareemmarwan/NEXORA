import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { computeOrderPricing } from '@/lib/pricing';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { orderItemInputSchema } from '@/lib/validation';
import type { ServiceAddon } from '@/types/database';

const previewSchema = z.object({
  items: z.array(orderItemInputSchema).min(1).max(10),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`preview:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const serviceIds = parsed.data.items.map((i) => i.serviceId);
  const { data: services, error } = await supabase
    .from('services')
    .select('*, service_addons(*)')
    .in('id', serviceIds)
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const pricingItems = [];
  const details = [];

  for (const item of parsed.data.items) {
    const service = serviceMap.get(item.serviceId);
    if (!service) {
      return NextResponse.json({ error: 'service_not_found', serviceId: item.serviceId }, { status: 404 });
    }

    const allAddons = (service.service_addons ?? []) as ServiceAddon[];
    const validAddons = allAddons.filter((a) => a.is_active && item.addonIds.includes(a.id));

    pricingItems.push({
      serviceId: service.id,
      unitPrice: Number(service.price),
      deliveryDays: service.delivery_days,
      quantity: item.quantity,
      addons: validAddons.map((a) => ({ id: a.id, price: Number(a.price), extra_days: a.extra_days })),
    });

    details.push({
      id: service.id,
      slug: service.slug,
      title_ar: service.title_ar,
      title_en: service.title_en,
      price: Number(service.price),
      currency: service.currency,
      price_type: service.price_type,
      delivery_days: service.delivery_days,
      requirements_ar: ((service.requirements_ar as unknown) as string[]) ?? [],
      requirements_en: ((service.requirements_en as unknown) as string[]) ?? [],
      addons: allAddons.map((a) => ({
        id: a.id,
        title_ar: a.title_ar,
        title_en: a.title_en,
        price: Number(a.price),
        extra_days: a.extra_days,
        is_active: a.is_active,
      })),
    });
  }

  const pricing = computeOrderPricing(pricingItems);

  return NextResponse.json({
    pricing: {
      subtotal: pricing.subtotal,
      total: pricing.total,
      maxDeliveryDays: pricing.maxDeliveryDays,
      currency: pricing.currency,
      items: pricing.items,
    },
    services: details,
  });
}
