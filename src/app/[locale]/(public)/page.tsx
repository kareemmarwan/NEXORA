import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  Search,
  Lightbulb,
  Cog,
  TrendingUp,
  Bot,
  Workflow,
  UsersRound,
  Plug,
  CheckCircle2,
  Repeat,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Rocket,
  ShoppingBag,
  Briefcase,
  Users,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Cpu,
  Network,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import heroCityImg from '@/app/hero-city.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion } from '@/components/ui/accordion';
import { PricingCards } from '@/components/ui/pricing-cards';
import { ServiceCard } from '@/components/services/service-card';
import { getCategories, getFeaturedServices } from '@/lib/data/services';
import { getSiteContent } from '@/lib/data/content';
import { pick } from '@/lib/utils/pick';
import { cn } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/utils/format';

const stepIcons = [Search, Lightbulb, Cog, TrendingUp];
const serviceIcons = [Brain, Workflow, UsersRound, Plug, Cpu];
const whyIcons = [CheckCircle2, Repeat, Plug, ArrowUpRight, ShieldCheck, RefreshCw];
const audienceIcons = [Rocket, ShoppingBag, Briefcase, Users];

function getCmsValue(
  contents: { key: string; content_ar: unknown; content_en: unknown }[],
  sectionKey: string,
  fieldPath: string,
  locale: SupportedLocale,
  fallback: string
): string {
  const section = contents.find((c) => c.key === sectionKey);
  if (!section) return fallback;
  const content = (locale === 'ar' ? section.content_ar : section.content_en) as Record<string, unknown>;
  if (!content) return fallback;
  const parts = fieldPath.split('.');
  let value: unknown = content;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return fallback;
    }
  }
  return typeof value === 'string' ? value : fallback;
}

function getCmsArray(
  contents: { key: string; content_ar: unknown; content_en: unknown }[],
  sectionKey: string,
  fieldPath: string,
  locale: SupportedLocale
): unknown[] {
  const section = contents.find((c) => c.key === sectionKey);
  if (!section) return [];
  const content = (locale === 'ar' ? section.content_ar : section.content_en) as Record<string, unknown>;
  if (!content) return [];
  const parts = fieldPath.split('.');
  let value: unknown = content;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }
  return Array.isArray(value) ? value : [];
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tc = await getTranslations('common');
  const tf = await getTranslations('faq');

  const [categories, featured, cmsContent] = await Promise.all([
    getCategories(),
    getFeaturedServices(6),
    getSiteContent(),
  ]);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  const heroImage = getCmsValue(cmsContent, 'hero', 'imageUrl', locale, heroCityImg.src);

  const steps = [1, 2, 3, 4].map((n) => ({
    icon: stepIcons[n - 1]!,
    title: getCmsValue(cmsContent, 'howItWorks', `steps.${n - 1}.title`, locale, t(`step${n}Title`)),
    desc: getCmsValue(cmsContent, 'howItWorks', `steps.${n - 1}.desc`, locale, t(`step${n}Desc`)),
  }));

  const services = [1, 2, 3, 4, 5].map((n) => ({
    icon: serviceIcons[n - 1]!,
    title: getCmsValue(cmsContent, 'services', `items.${n - 1}.title`, locale, t(`service${n}Title`)),
    desc: getCmsValue(cmsContent, 'services', `items.${n - 1}.desc`, locale, t(`service${n}Desc`)),
  }));

  const whyItems = [1, 2, 3, 4, 5, 6].map((n) => ({
    icon: whyIcons[n - 1]!,
    title: getCmsValue(cmsContent, 'whyUs', `items.${n - 1}.title`, locale, t(`why${n}Title`)),
    desc: getCmsValue(cmsContent, 'whyUs', `items.${n - 1}.desc`, locale, t(`why${n}Desc`)),
  }));

  const audienceItems = getCmsArray(cmsContent, 'audience', 'items', locale) as string[];
  const audiences = (audienceItems.length > 0
    ? audienceItems.map((label, i) => ({ icon: audienceIcons[i] ?? TrendingUp, label }))
    : [1, 2, 3, 4].map((n) => ({ icon: audienceIcons[n - 1]!, label: t(`audience${n}`) }))
  );
  if (audiences.length <= 4) {
    audiences.push({ icon: TrendingUp, label: getCmsValue(cmsContent, 'audience', 'items.4', locale, t('audience5')) });
  }

  const faqItems = getCmsArray(cmsContent, 'faq', 'items', locale) as { q: string; a: string }[];
  const faqs = faqItems.length > 0
    ? faqItems.map((item, i) => ({ id: `faq-${i + 1}`, question: item.q, answer: item.a }))
    : [1, 2, 3, 4, 5, 6].map((n) => ({ id: `faq-${n}`, question: tf(`q${n}`), answer: tf(`a${n}`) }));

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative -mt-16 flex min-h-svh items-center overflow-hidden bg-[#010714]">
        {/* Futuristic city scene (right) — fills the full hero height, blended into the dark background */}
        <div
          className="absolute inset-y-0 right-0 w-full opacity-60 sm:w-[44.2%] sm:opacity-100"
          aria-hidden="true"
        >
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover object-bottom mix-blend-screen [mask-image:linear-gradient(to_left,black_45%,transparent_96%)]"
          />
          {/* Soft fade at the top and bottom edges so the scene melts into the section */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#010714] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#010714] to-transparent" />
        </div>
        {/* Dark contrast behind the text */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#010714] from-30% to-transparent to-62%"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-start px-6 pb-2 pt-14 text-left sm:px-12" dir="ltr">
          {/* Main Title — English brand headline per reference (two lines on desktop) */}
          <h1
            className="font-nexora text-[clamp(26px,4.3vw,54px)] font-extrabold leading-[1.26] tracking-[-0.02em] text-white"
            style={{ fontFamily: 'var(--font-nexora), var(--font-arabic), system-ui, sans-serif' }}
          >
            AI Agents &amp; Automation
            <br />
            for a{' '}
            <span className="bg-gradient-to-r from-[#8456FC] to-[#30C0F0] bg-clip-text text-transparent">
              Smarter Tomorrow
            </span>
          </h1>

          {/* Description — RTL text, block positioned on the left as in the reference */}
          <p
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            className={cn(
              'mt-2 max-w-[30rem] text-[clamp(13px,1.95vw,17px)] leading-[1.55] text-white/85',
              locale === 'ar' ? 'text-right' : 'text-left'
            )}
            style={{ whiteSpace: 'pre-line' }}
          >
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/services"
              className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-[#8456FC] to-[#30C0F0] px-5 text-[13px] font-bold text-white transition-all hover:brightness-110"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/services"
              className="inline-flex h-9 items-center rounded-full border border-white/25 bg-white/[0.04] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.09]"
            >
              Watch Video
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Client Ticker ─── */}
      <section className="border-y border-white/[0.04] bg-card/30 py-5 overflow-hidden">
        <div className="flex items-center justify-center gap-8 px-4">
          {[
            t('service1Title') ?? 'AI Agents',
            t('service2Title') ?? 'Automation',
            t('service3Title') ?? 'Digital Workforce',
            t('service4Title') ?? 'Integrations',
            t('service5Title') ?? 'Custom AI',
          ].map((item) => (
            <span key={item} className="text-label text-muted-foreground/40 whitespace-nowrap">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Stats / Metrics Bar ─── */}
      <section className="relative border-y border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="container py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '500+', label: t('statsClients') ?? 'Clients' },
              { value: '98%', label: t('statsSatisfaction') ?? 'Satisfaction' },
              { value: '24/7', label: t('statsSupport') ?? 'Support' },
              { value: '< 24h', label: t('statsDelivery') ?? 'Delivery' },
            ].map((stat) => (
              <div key={stat.label} className="metric-card text-center">
                <div className="text-3xl font-bold text-foreground md:text-4xl font-brand tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 text-label text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Problem → Solution ─── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 section-tint" />
        <div className="absolute inset-0 dots-pattern opacity-20" />

        <div className="container relative">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 me-2" />
              {getCmsValue(cmsContent, 'whyUs', 'title', locale, t('problemTitle') ?? 'The Problem')}
            </Badge>
            <h2 className="text-heading-1 text-foreground">
              {getCmsValue(cmsContent, 'whyUs', 'title', locale, t('problemTitle') ?? 'AI services are scattered and confusing')}
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">
              {getCmsValue(cmsContent, 'whyUs', 'subtitle', locale, t('problemSubtitle') ?? 'Finding the right AI solution shouldn\'t take weeks of research.')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Without NEXORA */}
            <div className="feature-card border-destructive/20">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Cog className="h-5 w-5" />
                </span>
                <h3 className="text-heading-3 text-foreground">
                  {t('withoutTitle') ?? 'Without NEXORA'}
                </h3>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n} className="flex items-start gap-3 text-body text-muted-foreground">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                    </span>
                    {t(`problem${n}`) ?? `Problem ${n}`}
                  </li>
                ))}
              </ul>
            </div>

            {/* With NEXORA */}
            <div className="feature-card border-success/20">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <h3 className="text-heading-3 text-foreground">
                  {t('withTitle') ?? 'With NEXORA'}
                </h3>
              </div>
              <ul className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n} className="flex items-start gap-3 text-body text-muted-foreground">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                    </span>
                    {t(`solution${n}`) ?? `Solution ${n}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Services ─── */}
      <section className="container py-20 md:py-28">
        <div className="mb-14 text-center">
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <Cog className="h-3.5 w-3.5 me-2" />
            {getCmsValue(cmsContent, 'services', 'title', locale, t('servicesTitle'))}
          </Badge>
          <h2 className="text-heading-1 text-foreground">
            {getCmsValue(cmsContent, 'services', 'title', locale, t('servicesTitle'))}
          </h2>
          <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">{getCmsValue(cmsContent, 'services', 'subtitle', locale, t('servicesSubtitle'))}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, desc }, index) => (
            <Link
              key={title}
              href="/services"
              className="group relative flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-7"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="feature-icon flex h-14 w-14 items-center justify-center rounded-2xl text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 end-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <Arrow className="h-5 w-5 text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 section-tint" />
        <div className="absolute inset-0 dots-pattern opacity-30" />
        
        <div className="container relative">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Workflow className="h-3.5 w-3.5 me-2" />
              {getCmsValue(cmsContent, 'howItWorks', 'title', locale, t('howItWorksTitle'))}
            </Badge>
            <h2 className="text-heading-1 text-foreground">
              {getCmsValue(cmsContent, 'howItWorks', 'title', locale, t('howItWorksTitle'))}
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">{getCmsValue(cmsContent, 'howItWorks', 'subtitle', locale, t('howItWorksSubtitle'))}</p>
          </div>
          
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 -translate-y-1/2 z-0" />
            
            {steps.map(({ icon: Icon, title, desc }, index) => (
              <li
                key={title}
                className="relative flex flex-col items-center gap-5 rounded-2xl border border-border/50 bg-card p-8 text-center card-hover-effect z-10"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -start-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow-glow">
                  {index + 1}
                </div>
                
                <span className="feature-icon flex h-16 w-16 items-center justify-center rounded-2xl text-primary">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Featured services (real data) ─── */}
      {featured.length > 0 && (
        <section className="container py-20 md:py-28">
          <div className="mb-14 flex flex-wrap items-center justify-between gap-6">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 me-2" />
                {getCmsValue(cmsContent, 'hero', 'brandLabel', locale, t('featuredTitle'))}
              </Badge>
              <h2 className="text-heading-1 text-foreground">{getCmsValue(cmsContent, 'hero', 'brandLabel', locale, t('featuredTitle'))}</h2>
              <p className="mt-3 text-body-lg text-muted-foreground">{getCmsValue(cmsContent, 'services', 'subtitle', locale, t('featuredSubtitle'))}</p>
            </div>
            <Button variant="outline" className="group" asChild>
              <Link href="/services">
                {tc('viewAll')}
                <Arrow className="h-4 w-4 rtl:-scale-x-100 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((service, index) => (
              <div key={service.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ServiceCard service={service} locale={locale} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Categories (real data) ─── */}
      {categories.length > 0 && (
        <section className="relative py-14 md:py-20 overflow-hidden">
          <div className="absolute inset-0 section-tint" />
          <div className="absolute inset-0 grid-pattern opacity-40" />
          
          <div className="container relative">
            <div className="mb-10 text-center">
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Network className="h-3.5 w-3.5 me-2" />
                {t('categoriesTitle')}
              </Badge>
              <h2 className="text-heading-1 text-foreground">
                {t('categoriesTitle')}
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">{t('categoriesSubtitle')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/services?category=${category.slug}`}
                  className="group flex items-center gap-5 rounded-2xl border border-border/50 bg-card p-6 card-hover-effect overflow-hidden"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <span className="feature-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary">
                    <Bot className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col relative">
                    <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {pick(category, 'name', locale)}
                    </span>
                    <span className="line-clamp-2 text-sm text-muted-foreground mt-1">
                      {pick(category, 'description', locale)}
                    </span>
                  </div>
                  
                  <Arrow className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all ms-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Why NEXORA ─── */}
      <section id="about" className="container scroll-mt-24 py-20 md:py-28">
        <div className="mb-14 text-center">
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 me-2" />
            {getCmsValue(cmsContent, 'whyUs', 'title', locale, t('whyUsTitle'))}
          </Badge>
          <h2 className="text-heading-1 text-foreground">
            {getCmsValue(cmsContent, 'whyUs', 'title', locale, t('whyUsTitle'))}
          </h2>
          <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">{getCmsValue(cmsContent, 'whyUs', 'subtitle', locale, t('whyUsSubtitle'))}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyItems.map(({ icon: Icon, title, desc }, index) => (
            <div
              key={title}
              className="group relative flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-7 card-hover-effect overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="feature-icon flex h-14 w-14 items-center justify-center rounded-2xl text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Target audience ─── */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 section-tint" />
        <div className="absolute inset-0 dots-pattern opacity-20" />
        
        <div className="container relative">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Users className="h-3.5 w-3.5 me-2" />
              {getCmsValue(cmsContent, 'audience', 'title', locale, t('audienceTitle'))}
            </Badge>
            <h2 className="text-heading-1 text-foreground">
              {getCmsValue(cmsContent, 'audience', 'title', locale, t('audienceTitle'))}
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">{getCmsValue(cmsContent, 'audience', 'subtitle', locale, t('audienceSubtitle'))}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {audiences.map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-card px-6 py-3.5 text-sm font-medium text-foreground card-hover-effect"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Lightbulb className="h-3.5 w-3.5 me-2" />
              {getCmsValue(cmsContent, 'faq', 'title', locale, t('faqTitle'))}
            </Badge>
            <h2 className="text-heading-1 text-foreground">
              {getCmsValue(cmsContent, 'faq', 'title', locale, t('faqTitle'))}
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground">{getCmsValue(cmsContent, 'faq', 'subtitle', locale, t('faqSubtitle'))}</p>
          </div>
          <Accordion items={faqs} />
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="relative scroll-mt-24 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 section-tint" />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <div className="container relative">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 me-2" />
              {getCmsValue(cmsContent, 'pricing', 'title', locale, t('pricingTitle') ?? 'Pricing')}
            </Badge>
            <h2 className="text-heading-1 text-foreground">
              {getCmsValue(cmsContent, 'pricing', 'title', locale, t('pricingTitle') ?? 'Simple, transparent pricing')}
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground max-w-2xl mx-auto">
              {getCmsValue(cmsContent, 'pricing', 'subtitle', locale, t('pricingSubtitle') ?? 'No hidden fees. No commitments. Cancel anytime.')}
            </p>
          </div>

          {(() => {
            const pricingPlans = getCmsArray(cmsContent, 'pricing', 'plans', locale) as {
              name: string;
              desc: string;
              price: string;
              features: string[];
              cta: string;
            }[];
            const plans = pricingPlans.length > 0
              ? pricingPlans.map((plan, i) => ({
                  name: plan.name,
                  description: plan.desc,
                  price: plan.price,
                  period: t('planPeriod') ?? 'mo',
                  features: plan.features,
                  cta: plan.cta,
                  href: '/register',
                  popular: i === 1,
                }))
              : [
                  {
                    name: t('planFreeName') ?? 'Free',
                    description: t('planFreeDesc') ?? 'Try it out',
                    price: '$0',
                    period: t('planPeriod') ?? 'mo',
                    features: [
                      t('planFreeF1') ?? 'Browse all services',
                      t('planFreeF2') ?? 'Basic AI recommendations',
                      t('planFreeF3') ?? 'Email support',
                    ],
                    cta: t('planFreeCta') ?? 'Start for free',
                    href: '/register',
                  },
                  {
                    name: t('planProName') ?? 'Pro',
                    description: t('planProDesc') ?? 'For professionals',
                    price: '$49',
                    period: t('planPeriod') ?? 'mo',
                    features: [
                      t('planProF1') ?? 'Everything in Free',
                      t('planProF2') ?? 'Priority AI assistant',
                      t('planProF3') ?? 'Advanced analytics',
                      t('planProF4') ?? 'Priority support',
                      t('planProF5') ?? 'Custom workflows',
                    ],
                    cta: t('planProCta') ?? 'Get started',
                    href: '/register',
                    popular: true,
                  },
                  {
                    name: t('planEntName') ?? 'Enterprise',
                    description: t('planEntDesc') ?? 'For teams',
                    price: '$199',
                    period: t('planPeriod') ?? 'mo',
                    features: [
                      t('planEntF1') ?? 'Everything in Pro',
                      t('planEntF2') ?? 'Unlimited team members',
                      t('planEntF3') ?? 'API access',
                      t('planEntF4') ?? 'Dedicated support',
                      t('planEntF5') ?? 'Custom integrations',
                      t('planEntF6') ?? 'SLA guarantee',
                    ],
                    cta: t('planEntCta') ?? 'Contact us',
                    href: '/register',
                  },
                ];

            return (
              <div className="mx-auto max-w-5xl">
                <PricingCards plans={plans} />
              </div>
            );
          })()}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="container pb-24">
        <div className="brand-gradient relative overflow-hidden rounded-3xl px-8 py-20 text-center text-white md:py-28">
          {/* Background Effects */}
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <Badge className="bg-white/20 border-white/30 text-white mb-6 px-4 py-1.5">
              <Sparkles className="h-4 w-4 me-2" />
              {getCmsValue(cmsContent, 'cta', 'brandLabel', locale, t('brandLabel'))}
            </Badge>
            <h2 className="text-heading-1">{getCmsValue(cmsContent, 'cta', 'title', locale, t('ctaTitle'))}</h2>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-white/85">{getCmsValue(cmsContent, 'cta', 'subtitle', locale, t('ctaSubtitle'))}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="btn-modern h-14 px-8 text-base" asChild>
                <Link href="/services">
                  {getCmsValue(cmsContent, 'cta', 'button', locale, t('ctaButton'))}
                  <Arrow className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}