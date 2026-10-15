import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import { MAX_PROOF_SIZE, PROOF_ALLOWED_TYPES } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`proof:${ip}`, rateLimits.upload.limit, rateLimits.upload.windowMs);
  if (!limit.ok) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const file = formData.get('file');
  const note = formData.get('note');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }

  if (!PROOF_ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }

  if (file.size > MAX_PROOF_SIZE) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify order ownership and status.
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', parsedParams.data.id)
    .single();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (order.status !== 'pending_payment' && order.status !== 'payment_review') {
    return NextResponse.json({ error: 'not_allowed' }, { status: 400 });
  }

  const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] ?? 'png';
  const path = `${user.id}/${order.id}-${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[proof] upload failed', uploadError);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  const { data: proof, error: proofError } = await admin
    .from('payment_proofs')
    .insert({
      order_id: order.id,
      user_id: user.id,
      file_path: path,
      note: typeof note === 'string' && note.trim().length > 0 ? note.trim() : null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (proofError) {
    console.error('[proof] insert failed', proofError);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }

  await admin.from('order_events').insert({
    order_id: order.id,
    type: 'proof_uploaded',
    actor_id: user.id,
    message: null,
  });

  // Move order to payment_review (unless already paid).
  await admin
    .from('orders')
    .update({ status: 'payment_review', payment_status: 'under_review' })
    .eq('id', order.id)
    .eq('status', 'pending_payment');

  return NextResponse.json({ proofId: proof.id, path });
}
