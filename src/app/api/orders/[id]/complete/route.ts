import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const limit = rateLimit(`complete:${ip}`, rateLimits.general.limit, rateLimits.general.windowMs);
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

  const admin = createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', parsedParams.data.id)
    .single();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'not_allowed' }, { status: 400 });
  }

  await admin.from('orders').update({ status: 'completed' }).eq('id', order.id);

  await admin.from('order_events').insert({
    order_id: order.id,
    type: 'completed',
    from_status: 'delivered',
    to_status: 'completed',
    actor_id: user.id,
  });

  return NextResponse.json({ ok: true });
}
