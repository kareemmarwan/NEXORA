import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckCircle2, ListChecks, HelpCircle, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { Markdown } from '@/components/ui/markdown';
import { ServiceCard } from '@/components/services/service-card';
import { ServicePurchasePanel } from '@/components/services/service-purchase-panel';
import { getServiceBySlug, getRelatedServices } from '@/lib/data/services';
import { pick, pickJson } from '@/lib/utils/pick';
import { absoluteUrl } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/utils/format';
import type { ServiceFaq, OrderItemAddonSnapshot } from '@/types/database';

type Props = {
  params: { locale: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const service = await getServiceBySlug(params.slug);
  if (!service) return { title: 'Not found' };

  const title = pick(service, 'title', locale);
  const description = pick(service, 'short_desc', locale);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/services/${service.slug}`),
      languages: {
        ar: absoluteUrl(`/ar/services/${service.slug}`),
        en: absoluteUrl(`/en/services/${service.slug}`),
      },
    },
    openGraph: {
      title,
      description,
      images: service.cover_image_url ? [{ url: service.cover_image_url }] : undefined,
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);

  const service = await getServiceBySlug(params.slug);
  if (!service || !service.is_active) notFound();

  const t = await getTranslations('service');
  const tc = await getTranslations('common');

  const title = pick(service, 'title', locale);
  const description = pick(service, 'description', locale);
  const features = pickJson<string[]>(service, 'features', locale);
  const requirements = pickJson<string[]>(service, 'requirements', locale);
  const faqs = pickJson<ServiceFaq[]>(service, 'faqs', locale);

  const related = await getRelatedServices(service.category_id, service.id, 3);

  const addons = service.service_addons
    .filter((a) => a.is_active)
    .map((a: OrderItemAddonSnapshot & { is_active?: boolean }) => ({
      id: a.id,
      title_ar: a.title_ar,
      title_en: a.title_en,
      price: Number(a.price),
      extra_days: a.extra_days,
    }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description: pick(service, 'short_desc', locale),
    url: absoluteUrl(`/${locale}/services/${service.slug}`),
    image: service.cover_image_url ?? undefined,
    provider: {
      '@type': 'Organization',
      name: 'AI Services Platform',
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: service.currency,
      availability: 'https://schema.org/InStock',
    },
    serviceType: service.categories ? pick(service.categories, 'name', locale) : undefined,
  };

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {service.categories && (
          <Link href={`/services?category=${service.categories.slug}`}>
            <Badge variant="muted">{pick(service.categories, 'name', locale)}</Badge>
          </Link>
        )}
        {service.is_featured && <Badge variant="warning">{tc('featured')}</Badge>}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
            <p className="mt-3 text-muted-foreground">{pick(service, 'short_desc', locale)}</p>
          </div>

          <div className="relative h-64 overflow-hidden rounded-2xl border border-border bg-muted md:h-80">
            {service.cover_image_url ? (
              <Image
                src={service.cover_image_url}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                <span className="text-6xl font-bold text-primary/40">AI</span>
              </div>
            )}
          </div>

          {description && (
            <section aria-label={tc('services')}>
              <Markdown>{description}</Markdown>
            </section>
          )}

          {features.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <ListChecks className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('whatsIncluded')}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {requirements.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                {t('whatWeNeed')}
              </h2>
              <ul className="grid gap-3">
                {requirements.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {faqs.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('faqs')}
              </h2>
              <Accordion
                items={faqs.map((faq, index) => ({
                  id: `faq-${index}`,
                  question: locale === 'ar' ? faq.q_ar : faq.q_en,
                  answer: locale === 'ar' ? faq.a_ar : faq.a_en,
                }))}
              />
            </section>
          )}
        </div>

        {/* Sticky sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <ServicePurchasePanel
              service={{
                id: service.id,
                slug: service.slug,
                titleAr: service.title_ar,
                titleEn: service.title_en,
                price: Number(service.price),
                currency: service.currency,
                priceType: service.price_type,
                deliveryDays: service.delivery_days,
                revisions: service.revisions,
                coverImageUrl: service.cover_image_url,
              }}
              addons={addons}
            />
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t('relatedServices')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ServiceCard key={r.id} service={r} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href="/services">{t('browseAll')}</Link>
        </Button>
      </div>
    </div>
  );
}
