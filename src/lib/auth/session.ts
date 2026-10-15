import 'server-only';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types/database';

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    profile: profile ?? null,
  };
});

export async function requireUser(locale: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  return user;
}

export async function requireAdmin(locale: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  if (user.profile?.role !== 'admin') {
    redirect(`/${locale}`);
  }
  return user;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'admin';
}
