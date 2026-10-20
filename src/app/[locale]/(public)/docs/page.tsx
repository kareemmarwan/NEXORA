import { getTranslations, setRequestLocale } from 'next-intl/server';
import { UserRound, ShoppingCart, Package, ArrowRight, FileText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getDocSections } from '@/lib/data/docs';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';
import type { Metadata } from 'next';
import type { DocSection } from '@/lib/data/docs';

const SECTION_ICONS = {
  user: UserRound,
  cart: ShoppingCart,
  package: Package,
} as const;

function SectionIcon({ section }: { section: DocSection }) {
  const Icon = SECTION_ICONS[section.icon];
  return <Icon className="h-5 w-5" aria-hidden="true" />;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const t = await getTranslations({ locale, namespace: 'docs' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function DocsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('docs');
  const sections = await getDocSections();

  return (
    <div>
      {/* Page header */}
      <section className="bg-navy py-12 text-white">
        <div className="container">
          <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-white/70">{t('subtitle')}</p>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.id}
              className="rounded-2xl border border-border bg-card p-6"
              aria-labelledby={`docs-section-${section.id}`}
            >
              <div className="mb-4 flex items-center gap-2.5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <SectionIcon section={section} />
                </span>
                <h2 id={`docs-section-${section.id}`} className="text-lg font-bold text-foreground">
                  {pick(section, 'title', locale)}
                </h2>
              </div>

              <ul className="flex flex-col gap-1">
                {section.articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/docs/${article.slug}`}
                      className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary/60" aria-hidden="true" />
                        {pick(article, 'title', locale)}
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
