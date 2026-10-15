import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Sparkles,
  MousePointerClick,
  CreditCard,
  PackageCheck,
  BadgeCheck,
  CalendarClock,
  Languages,
  Headphones,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion } from '@/components/ui/accordion';
import { ServiceCard } from '@/components/services/service-card';
import { getCategories, getFeaturedServices } from '@/lib/data/services';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';

const stepIcons = [MousePointerClick, Sparkles, CreditCard, PackageCheck];
const whyIcons = [BadgeCheck, CalendarClock, Languages, Headphones];

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const tf = await getTranslations('faq');

  const [categories, featured] = await Promise.all([getCategories(), getFeaturedServices(6)]);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  const steps = [1, 2, 3, 4].map((n) => ({
    icon: stepIcons[n - 1]!,
    title: t(`step${n}Title`),
    desc: t(`step${n}Desc`),
  }));

  const whyUs = [
    { icon: whyIcons[0]!, title: t('whyFixedPriceTitle'), desc: t('whyFixedPriceDesc') },
    { icon: whyIcons[1]!, title: t('whyFixedDeliveryTitle'), desc: t('whyFixedDeliveryDesc') },
    { icon: whyIcons[2]!, title: t('whyArabicTitle'), desc: t('whyArabicDesc') },
    { icon: whyIcons[3]!, title: t('whySupportTitle'), desc: t('whySupportDesc') },
  ];

  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: `faq-${n}`,
    question: tf(`q${n}`),
    answer: tf(`a${n}`),
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.07] to-transparent">
        <div className="container flex flex-col items-center gap-8 py-16 text-center md:py-24">
          <Badge variant="primary" className="px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t('heroBadge')}
          </Badge>
          <h1 className="max-w-3xl text-balance text-3xl font-bold leading-tight text-foreground md:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
            {t('heroSubtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/services">
                {t('heroCta')}
                <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">{t('heroSecondaryCta')}</Link>
            </Button>
          </div>

          <dl className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-4">
            {[
              [t('heroStat1Value'), t('heroStat1Label')],
              [t('heroStat2Value'), t('heroStat2Label')],
              [t('heroStat3Value'), t('heroStat3Label')],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-bold text-primary">{value}</dd>
                <dd className="text-xs text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{t('howItWorksTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('howItWorksSubtitle')}</p>
        </div>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, desc }, index) => (
            <li
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {tc('page')} {index + 1}
                </span>
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured services */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">{t('featuredTitle')}</h2>
              <p className="mt-2 text-muted-foreground">{t('featuredSubtitle')}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/services">
                {tc('viewAll')}
                <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">{t('categoriesTitle')}</h2>
          <p className="mt-2 text-muted-foreground">{t('categoriesSubtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/services?category=${category.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground group-hover:text-primary">
                  {pick(category, 'name', locale)}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {pick(category, 'description', locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">{t('whyUsTitle')}</h2>
            <p className="mt-2 text-muted-foreground">{t('whyUsSubtitle')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">{t('faqTitle')}</h2>
            <p className="mt-2 text-muted-foreground">{t('faqSubtitle')}</p>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-20">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-14 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">{t('ctaTitle')}</h2>
          <p className="max-w-xl text-primary-foreground/90">{t('ctaSubtitle')}</p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/services">
              {t('ctaButton')}
              <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
