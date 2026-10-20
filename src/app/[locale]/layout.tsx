import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/layout/providers';
import { GradientIconDefs } from '@/components/ui/gradient-icon';
import { Header, type HeaderUser } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { createClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils/cn';
import '@/app/globals.css';

/* All fonts are self-hosted (next/font/local) — Google Fonts
   downloads were failing at build time, silently swapping every
   family for a system fallback. Local files render offline and
   keep the CSS variables identical. */
const spaceGrotesk = localFont({
  src: [
    { path: '../../fonts/SpaceGrotesk-400.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/SpaceGrotesk-500.ttf', weight: '500', style: 'normal' },
    { path: '../../fonts/SpaceGrotesk-600.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/SpaceGrotesk-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-brand',
  display: 'swap',
});

const inter = localFont({
  src: [
    { path: '../../fonts/Inter-400.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/Inter-500.ttf', weight: '500', style: 'normal' },
    { path: '../../fonts/Inter-600.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/Inter-700.ttf', weight: '700', style: 'normal' },
    { path: '../../fonts/Inter-800.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-english',
  display: 'swap',
});

const cairo = localFont({
  src: [
    { path: '../../fonts/Cairo-400.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/Cairo-500.ttf', weight: '500', style: 'normal' },
    { path: '../../fonts/Cairo-600.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/Cairo-700.ttf', weight: '700', style: 'normal' },
    { path: '../../fonts/Cairo-800.ttf', weight: '800', style: 'normal' },
  ],
  variable: '--font-arabic',
  display: 'swap',
});

const jetbrainsMono = localFont({
  src: [
    { path: '../../fonts/JetBrainsMono-400.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/JetBrainsMono-500.ttf', weight: '500', style: 'normal' },
    { path: '../../fonts/JetBrainsMono-600.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/JetBrainsMono-700.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
});

const orbitron = localFont({
  src: [
    { path: '../../fonts/Orbitron-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../fonts/Orbitron-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../../fonts/Orbitron-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../../fonts/Orbitron-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../../fonts/Orbitron-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../../fonts/Orbitron-Black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-nexora',
  display: 'swap',
});

const fontVariables = `${spaceGrotesk.variable} ${inter.variable} ${cairo.variable} ${jetbrainsMono.variable} ${orbitron.variable}`;

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
    description: t('metaDescription'),
    openGraph: {
      type: 'website',
      siteName: t('appName'),
      title: t('appName'),
      description: t('metaDescription'),
      locale,
    },
    twitter: {
      card: 'summary',
      title: t('appName'),
      description: t('metaDescription'),
    },
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
      className={fontVariables}
    >
      <body className="font-sans" suppressHydrationWarning>
        <GradientIconDefs />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
            >
              {t('skipToContent')}
            </a>
            <Header user={user} />
            <div className="noise" aria-hidden="true" />
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
