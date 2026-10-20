import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimits } from '@/lib/utils/rate-limit';
import type { User } from '@supabase/supabase-js';

/**
 * Shared guard for /api/admin/* routes.
 * Returns the authenticated admin user, or null when the caller
 * is unauthenticated or lacks the admin role.
 */
export async function requireAdminUser(): Promise<User | null> {
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

export type AdminGuardResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

/**
 * Rate-limit + admin check in one call for an admin API route.
 */
export async function guardAdminApi(
  request: NextRequest,
  scope: string,
  limits?: { limit: number; windowMs: number }
): Promise<AdminGuardResult> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const conf = limits ?? rateLimits.general;
  const limit = rateLimit(`admin-${scope}:${ip}`, conf.limit, conf.windowMs);
  if (!limit.ok) {
    return { ok: false, response: NextResponse.json({ error: 'rate_limited' }, { status: 429 }) };
  }

  const adminUser = await requireAdminUser();
  if (!adminUser) {
    return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }

  return { ok: true, user: adminUser };
}
