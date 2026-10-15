import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeOrderPricing } from '@/lib/pricing';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { createOrderSchema } from '@/lib/validation';
import { sendOrderCreatedEmail } from '@/lib/email';
import { getStripe, isStripeEnabled } from '@/lib/stripe';
import { absoluteUrl } from '@/lib/utils/cn';
import type { ServiceAddon, OrderItemAddonSnapshot, Json } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`orders:${ip}`, rateLimits.orderCreate.limit, rateLimits.orderCreate.windowMs);
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
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  // Online payment requires Stripe to be configured.
  if (input.paymentMethodType === 'stripe' && !isStripeEnabled()) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 400 });
  }

  // Validate chosen manual payment method exists and is active.
  let paymentMethodId: string | null = null;
  if (input.paymentMethodType === 'manual') {
    const admin = createAdminClient();
    const { data: method } = await admin
      .from('payment_methods')
      .select('id')
      .eq('id', input.paymentMethodId ?? '')
      .eq('is_active', true)
      .single();
    if (!method) {
      return NextResponse.json({ error: 'payment_method_not_found' }, { status: 400 });
    }
    paymentMethodId = method.id;
  }

  // Recompute ALL prices server-side from the database. Never trust the client.
  const admin = createAdminClient();
  const serviceIds = input.items.map((i) => i.serviceId);
  const { data: services, error: servicesError } = await admin
    .from('services')
    .select('*, service_addons(*)')
    .in('id', serviceIds)
    .eq('is_active', true);

  if (servicesError) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  const serviceMap = new Map((services ?? []).map((s) => [s.id, s]));

  const pricingItems = [];
  const itemSnapshots: {
    service_id: string;
    title_snapshot_ar: string;
    title_snapshot_en: string;
    unit_price: number;
    delivery_days: number;
    quantity: number;
    addons: Json;
  }[] = [];

  for (const item of input.items) {
    const service = serviceMap.get(item.serviceId);
    if (!service) {
      return NextResponse.json({ error: 'service_not_found', serviceId: item.serviceId }, { status: 404 });
    }

    const allAddons = (service.service_addons ?? []) as ServiceAddon[];
    const validAddons = allAddons.filter((a) => a.is_active && item.addonIds.includes(a.id));

    const addonSnapshots: OrderItemAddonSnapshot[] = validAddons.map((a) => ({
      id: a.id,
      title_ar: a.title_ar,
      title_en: a.title_en,
      price: Number(a.price),
      extra_days: a.extra_days,
    }));

    const unitBase = Number(service.price);
    const unitAddonTotal = addonSnapshots.reduce((sum, a) => sum + a.price, 0);
    const extraDays = addonSnapshots.reduce((sum, a) => sum + a.extra_days, 0);

    pricingItems.push({
      serviceId: service.id,
      unitPrice: unitBase,
      deliveryDays: service.delivery_days,
      quantity: item.quantity,
      addons: addonSnapshots.map((a) => ({ id: a.id, price: a.price, extra_days: a.extra_days })),
    });

    itemSnapshots.push({
      service_id: service.id,
      title_snapshot_ar: service.title_ar,
      title_snapshot_en: service.title_en,
      unit_price: Math.round((unitBase + unitAddonTotal) * 100) / 100,
      delivery_days: service.delivery_days + extraDays,
      quantity: item.quantity,
      addons: addonSnapshots as unknown as Json,
    });
  }

  const pricing = computeOrderPricing(pricingItems);

  // Verify the brief covers every service.
  for (const item of input.items) {
    const entry = input.brief[item.serviceId];
    if (!entry || entry.answers.length === 0 || entry.answers.some((a) => a.trim().length === 0)) {
      return NextResponse.json({ error: 'brief_incomplete', serviceId: item.serviceId }, { status: 400 });
    }
  }

  // Create the order + items + event atomically via the service role.
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      status: input.paymentMethodType === 'stripe' ? 'pending_payment' : 'pending_payment',
      payment_method_type: input.paymentMethodType,
      payment_method_id: paymentMethodId,
      payment_status: 'unpaid',
      subtotal: pricing.subtotal,
      total: pricing.total,
      currency: pricing.currency,
      customer_notes: input.customerNotes ?? null,
      brief: {
        answers: input.brief,
        contact_phone: input.contactPhone,
      } as unknown as Json,
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    console.error('[orders] insert failed', orderError);
    return NextResponse.json({ error: 'order_create_failed' }, { status: 500 });
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    itemSnapshots.map((snapshot) => ({
      order_id: order.id,
      ...snapshot,
    }))
  );

  if (itemsError) {
    console.error('[orders] items insert failed', itemsError);
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json({ error: 'order_create_failed' }, { status: 500 });
  }

  await admin.from('order_events').insert({
    order_id: order.id,
    type: 'created',
    to_status: 'pending_payment',
    actor_id: user.id,
    message: null,
  });

  // Stripe checkout session.
  if (input.paymentMethodType === 'stripe') {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: itemSnapshots.map((snapshot) => ({
          quantity: snapshot.quantity,
          price_data: {
            currency: pricing.currency.toLowerCase(),
            product_data: {
              name: snapshot.title_snapshot_en,
              description: Array.isArray(snapshot.addons)
                ? snapshot.addons
                    .map((a) => (a as unknown as OrderItemAddonSnapshot).title_en)
                    .join(', ') || undefined
                : undefined,
            },
            unit_amount: Math.round(snapshot.unit_price * 100),
          },
        })),
        metadata: { order_id: order.id },
        success_url: absoluteUrl(`/orders/${order.id}?payment=success`),
        cancel_url: absoluteUrl(`/orders/${order.id}?payment=cancelled`),
        customer_email: user.email ?? undefined,
      });

      await admin
        .from('orders')
        .update({ stripe_session_id: session.id })
        .eq('id', order.id);

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        redirectUrl: session.url,
      });
    } catch (stripeError) {
      console.error('[orders] stripe session failed', stripeError);
      return NextResponse.json({ error: 'stripe_session_failed' }, { status: 500 });
    }
  }

  // Optional email notification (skipped silently without RESEND_API_KEY).
  if (user.email) {
    await sendOrderCreatedEmail({
      to: user.email,
      orderNumber: order.order_number,
      total: `${pricing.total} ${pricing.currency}`,
      locale: (input as { locale?: 'ar' | 'en' }).locale ?? 'ar',
    });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    redirectUrl: null,
  });
}
