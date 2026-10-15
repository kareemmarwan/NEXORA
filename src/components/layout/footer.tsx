import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Mail, Phone } from 'lucide-react';

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations('footer');
  const tc = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-navy">
      <div className="container grid gap-10 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Link href="/" className="text-lg font-bold text-white">
            {tc('appName')}
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-white/70">{t('tagline')}</p>
        </div>

        <nav aria-label={t('quickLinks')} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">{t('quickLinks')}</h2>
          <ul className="flex flex-col gap-2 text-sm text-white/70">
            <li>
              <Link href="/" className="hover:text-white">
                {tc('home')}
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                {tc('services')}
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-white">
                {tc('checkout')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">{t('contactUs')}</h2>
          <a
            href={`mailto:${t('contactEmail')}`}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {t('contactEmail')}
          </a>
          <a
            href={`tel:${t('contactPhone').replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
            dir="ltr"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {t('contactPhone')}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="container text-center text-xs text-white/60">
          © {year} {tc('appName')} — {t('rights')}
        </p>
      </div>
    </footer>
  );
}
