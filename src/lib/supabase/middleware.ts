import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

const PROTECTED_PREFIXES = ['/cart', '/checkout', '/orders', '/account'];
const ADMIN_PREFIX = '/admin';

function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/');
  if (segments[1] === 'ar' || segments[1] === 'en') {
    return '/' + segments.slice(2).join('/');
  }
  return pathname;
}

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set({ name, value });
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawPath = request.nextUrl.pathname;
  const path = pathWithoutLocale(rawPath);
  const locale = rawPath.split('/')[1] === 'en' ? 'en' : 'ar';

  const needsAuth = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  const needsAdmin = path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);

  if ((needsAuth || needsAdmin) && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('next', rawPath);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  return response;
}
