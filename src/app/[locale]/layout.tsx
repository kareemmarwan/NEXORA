import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/layout/providers';
import { Header, type HeaderUser } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { createClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils/cn';
import '@/app/globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-sans',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = routing.locales.includes(params.locale as 'ar' | 'en')
    ? params.locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    metadataBase: new URL(absoluteUrl('/')),
    title: {
      default: t('appName'),
      template: `%s | ${t('shortName')}`,
    },
    description: t('tagline'),
    alternates: {
      languages: {
        ar: '/ar',
        en: '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(params.locale as 'ar' | 'en')) {
    notFound();
  }

  const locale = params.locale as 'ar' | 'en';
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' });

  const isRtl = locale === 'ar';

  let user: HeaderUser | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', authUser.id)
          .single();
        user = {
          id: authUser.id,
          email: authUser.email ?? null,
          fullName: profile?.full_name ?? null,
          role: profile?.role ?? 'customer',
        };
      }
    } catch {
      user = null;
    }
  }

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={cairo.variable}
    >
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              {t('skipToContent')}
            </a>
            <Header user={user} />
            <main id="main-content" className="min-h-[60vh]">
              {children}
            </main>
            <Footer locale={locale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
