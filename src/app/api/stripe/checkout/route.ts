import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe, isStripeEnabled } from '@/lib/stripe';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { absoluteUrl } from '@/lib/utils/cn';
import type { OrderItemAddonSnapshot } from '@/types/database';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderId: z.string().uuid(),
  locale: z.enum(['ar', 'en']).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`stripe:${ip}`, rateLimits.orderCreate.limit, rateLimits.orderCreate.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  if (!isStripeEnabled()) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', parsed.data.orderId)
    .single();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (order.payment_status === 'paid') {
    return NextResponse.json({ error: 'already_paid' }, { status: 400 });
  }

  if (order.status !== 'pending_payment' && order.status !== 'payment_review') {
    return NextResponse.json({ error: 'not_allowed' }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    // Reuse an existing session when possible.
    if (order.stripe_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (existing.status === 'open') {
        return NextResponse.json({ url: existing.url });
      }
    }

    const locale = parsed.data.locale ?? 'ar';
    const lineItems = (order.order_items ?? []).map((item) => {
      const addons = (item.addons as unknown as OrderItemAddonSnapshot[]) ?? [];
      return {
        quantity: item.quantity,
        price_data: {
          currency: (order.currency || 'USD').toLowerCase(),
          product_data: {
            name: item.title_snapshot_en,
            description: addons.map((a) => a.title_en).join(', ') || undefined,
          },
          unit_amount: Math.round(Number(item.unit_price) * 100),
        },
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      metadata: { order_id: order.id },
      success_url: absoluteUrl(`/${locale}/orders/${order.id}?payment=success`),
      cancel_url: absoluteUrl(`/${locale}/orders/${order.id}?payment=cancelled`),
      customer_email: user.email ?? undefined,
    });

    await admin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[stripe/checkout] failed', error);
    return NextResponse.json({ error: 'stripe_session_failed' }, { status: 500 });
  }
}
