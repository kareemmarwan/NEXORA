import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error('[stripe/webhook] signature verification failed', error);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) break;

      // Idempotency: skip if the order is already marked paid.
      const { data: order } = await admin
        .from('orders')
        .select('id, status, payment_status')
        .eq('id', orderId)
        .single();

      if (!order) break;
      if (order.payment_status === 'paid') break;

      const update = await admin
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null,
        })
        .eq('id', orderId)
        .eq('payment_status', 'unpaid')
        .select('id');

      if (update.data && update.data.length > 0) {
        await admin.from('order_events').insert({
          order_id: orderId,
          type: 'payment_confirmed',
          from_status: 'pending_payment',
          to_status: 'paid',
          message: 'Stripe payment confirmed',
        });
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      if (!orderId) break;
      await admin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId)
        .eq('payment_status', 'unpaid');
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
