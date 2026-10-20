import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Mail, Phone, Twitter, Instagram, Linkedin, Github, Facebook } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { getSiteSettings } from '@/lib/data/content';

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations('footer');
  const tc = await getTranslations('common');
  const year = new Date().getFullYear();

  // Admin-managed settings (fall back to i18n when unset).
  const settings = await getSiteSettings();
  const settingMap = new Map(settings.map((row) => [row.key, row]));
  function setting(key: string): string {
    const row = settingMap.get(key);
    if (!row) return '';
    return ((locale === 'en' ? row.value_en : row.value_ar) || '').trim();
  }

  const description = setting('footer_description') || t('description');
  const contactEmail = setting('contact_email') || t('contactEmail');
  const contactPhone = setting('contact_phone') || t('contactPhone');

  const socials = (
    [
      { key: 'social_x', label: 'X', Icon: Twitter },
      { key: 'social_instagram', label: 'Instagram', Icon: Instagram },
      { key: 'social_linkedin', label: 'LinkedIn', Icon: Linkedin },
      { key: 'social_github', label: 'GitHub', Icon: Github },
      { key: 'social_facebook', label: 'Facebook', Icon: Facebook },
    ] as const
  ).filter((item) => setting(item.key).length > 0);

  const quickLinks = [
    { href: '/', label: tc('home') },
    { href: '/services', label: tc('services') },
    { href: '/docs', label: t('docsTitle') },
    { href: '/orders', label: tc('checkout') },
  ];

  const serviceLinks = [
    { href: '/services', label: t('service1') },
    { href: '/services', label: t('service2') },
    { href: '/services', label: t('service3') },
    { href: '/services', label: t('service4') },
  ];

  return (
    <footer className="relative overflow-hidden bg-navy">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-[0.03]" />

      <div className="container relative">
        {/* Main Footer */}
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" aria-label={tc('shortName')} className="inline-block mb-5">
              <Logo tone="onDark" showTagline size="md" />
            </Link>
            <p className="text-body text-white/40 mb-6 max-w-xs">{description}</p>

            {/* Social */}
            {socials.length > 0 && (
              <div className="flex items-center gap-2">
                {socials.map(({ key, label, Icon }) => (
                  <a
                    key={key}
                    href={setting(key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] text-white/30 hover:text-white/70 hover:border-white/[0.12] transition-all duration-200"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <nav aria-label={t('quickLinks')}>
            <h3 className="text-label text-white/50 uppercase tracking-wider mb-4">{t('quickLinks')}</h3>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-body text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    <span className="h-px w-0 bg-primary/50 group-hover:w-3 transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <div>
            <h3 className="text-label text-white/50 uppercase tracking-wider mb-4">{tc('services')}</h3>
            <ul className="flex flex-col gap-2.5">
              {serviceLinks.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 text-body text-white/40 hover:text-white/80 transition-colors duration-200"
                  >
                    <span className="h-px w-0 bg-accent/50 group-hover:w-3 transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-label text-white/50 uppercase tracking-wider mb-4">{t('contactUs')}</h3>
            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${contactEmail}`}
                className="group inline-flex items-center gap-3 text-body text-white/40 hover:text-white/80 transition-colors duration-200"
              >
                <Mail className="h-4 w-4 text-white/30" aria-hidden="true" />
                <span dir="ltr">{contactEmail}</span>
              </a>
              <a
                href={`tel:${contactPhone.replace(/\s/g, '')}`}
                className="group inline-flex items-center gap-3 text-body text-white/40 hover:text-white/80 transition-colors duration-200"
                dir="ltr"
              >
                <Phone className="h-4 w-4 text-white/30" aria-hidden="true" />
                <span>{contactPhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/[0.06] py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-body font-medium text-white/70 mb-0.5">{t('newsletterTitle')}</h3>
              <p className="text-small text-white/30">{t('newsletterDesc')}</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder={t('newsletterPlaceholder')}
                className="flex-1 md:w-64 h-10 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-[13px] focus:outline-none focus:border-primary/40 transition-all duration-200"
              />
              <button className="h-10 px-5 rounded-lg bg-gradient-to-r from-[#30C0F0] to-[#9048F0] text-white text-[13px] font-bold hover:brightness-110 transition-all duration-200">
                {t('newsletterCta')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-white/25">
              © {year} {tc('appName')} — {t('rights')}
            </p>
            <div className="flex items-center gap-5">
              {[t('privacyPolicy'), t('termsOfService'), t('cookiePolicy')].map((item) => (
                <Link
                  key={item}
                  href="/"
                  className="text-[12px] text-white/25 hover:text-white/50 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}