import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { orderStatusSchema } from '@/lib/validation';
import { sendPaymentConfirmedEmail, sendDeliveredEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

const bodySchema = z.union([
  z.object({
    action: z.literal('status'),
    status: orderStatusSchema,
    message: z.string().trim().max(2000).optional(),
  }),
  z.object({
    action: z.literal('delivery_notes'),
    deliveryNotes: z.string().trim().max(10000),
  }),
  z.object({
    action: z.literal('internal_notes'),
    internalNotes: z.string().trim().max(10000),
  }),
  z.object({
    action: z.literal('review_proof'),
    proofId: z.string().uuid(),
    proofAction: z.enum(['approve', 'reject']),
  }),
]);

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
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`admin-order:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }

  const admin = createAdminClient();
  const orderId = parsedParams.data.id;

  const { data: order } = await admin
    .from('orders')
    .select('id, status, payment_status, user_id')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const input = parsed.data;

  if (input.action === 'status') {
    const fromStatus = order.status;
    await admin.from('orders').update({ status: input.status }).eq('id', orderId);

    if (input.status === 'delivered') {
      await admin
        .from('orders')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    await admin.from('order_events').insert({
      order_id: orderId,
      type: input.status === 'delivered' ? 'delivered' : input.status === 'cancelled' ? 'cancelled' : input.status === 'completed' ? 'completed' : 'status_changed',
      from_status: fromStatus,
      to_status: input.status,
      actor_id: adminUser.id,
      message: input.message ?? null,
    });

    // Optional emails.
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', order.user_id)
      .single();
    void profile;

    return NextResponse.json({ ok: true });
  }

  if (input.action === 'delivery_notes') {
    await admin
      .from('orders')
      .update({ delivery_notes: input.deliveryNotes })
      .eq('id', orderId);
    return NextResponse.json({ ok: true });
  }

  if (input.action === 'internal_notes') {
    await admin
      .from('orders')
      .update({ internal_notes: input.internalNotes })
      .eq('id', orderId);
    return NextResponse.json({ ok: true });
  }

  // review_proof
  const { data: proof } = await admin
    .from('payment_proofs')
    .select('id, user_id, status')
    .eq('id', input.proofId)
    .eq('order_id', orderId)
    .single();

  if (!proof) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (proof.status !== 'pending') {
    return NextResponse.json({ error: 'already_reviewed' }, { status: 400 });
  }

  const newProofStatus = input.proofAction === 'approve' ? 'approved' : 'rejected';
  await admin
    .from('payment_proofs')
    .update({
      status: newProofStatus,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', proof.id);

  if (input.proofAction === 'approve') {
    await admin
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await admin.from('order_events').insert({
      order_id: orderId,
      type: 'payment_confirmed',
      from_status: order.status,
      to_status: 'paid',
      actor_id: adminUser.id,
      message: null,
    });

    // Optional email to customer.
    const { data: customer } = await admin.auth.admin.getUserById(order.user_id);
    if (customer?.user?.email) {
      const { data: fullOrder } = await admin
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();
      await sendPaymentConfirmedEmail({
        to: customer.user.email,
        orderNumber: fullOrder?.order_number ?? '',
        locale: 'ar',
      });
    }
  } else {
    await admin
      .from('orders')
      .update({ status: 'payment_review', payment_status: 'under_review' })
      .eq('id', orderId);

    await admin.from('order_events').insert({
      order_id: orderId,
      type: 'status_changed',
      from_status: order.status,
      to_status: 'payment_review',
      actor_id: adminUser.id,
      message: 'Payment proof rejected',
    });
  }

  void sendDeliveredEmail;
  return NextResponse.json({ ok: true });
}
