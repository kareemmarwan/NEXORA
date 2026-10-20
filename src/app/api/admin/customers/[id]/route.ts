import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdminApi } from '@/lib/auth/admin-guard';
import { createAdminSchemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schemas = createAdminSchemas((key) => key);
const paramsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request, 'customer');
  if (!guard.ok) return guard.response;

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schemas.customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  // Prevent self-lockout: an admin cannot change their own role.
  if (input.role && guard.user.id === parsedParams.data.id) {
    return NextResponse.json({ error: 'cannot_change_own_role' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Prevent demoting the last remaining admin.
  if (input.role === 'customer') {
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'last_admin' }, { status: 400 });
    }
  }

  const update: Record<string, string> = {
    full_name: input.fullName,
    phone: input.phone ?? '',
    business_name: input.businessName ?? '',
  };
  if (input.role) update.role = input.role;

  const { error } = await admin.from('profiles').update(update).eq('id', parsedParams.data.id);

  if (error) {
    console.error('[admin/customers] update failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
