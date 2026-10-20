import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Clock, FileText } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Markdown } from '@/components/ui/markdown';
import { getDocArticleBySlug, getDocNeighbors, getDocSections } from '@/lib/data/docs';
import { pick } from '@/lib/utils/pick';
import { absoluteUrl } from '@/lib/utils/cn';
import { cn } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/utils/format';

type Props = {
  params: { locale: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const article = await getDocArticleBySlug(params.slug);
  if (!article) return { title: 'Not found' };

  const title = pick(article, 'title', locale);
  const description = pick(article, 'description', locale);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/docs/${article.slug}`),
      languages: {
        ar: absoluteUrl(`/ar/docs/${article.slug}`),
        en: absoluteUrl(`/en/docs/${article.slug}`),
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

export default async function DocArticlePage({ params }: Props) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);

  const article = await getDocArticleBySlug(params.slug);
  if (!article) notFound();

  const t = await getTranslations('docs');
  const tc = await getTranslations('common');
  const sections = await getDocSections();
  const { prev, next } = await getDocNeighbors(article.slug);

  const title = pick(article, 'title', locale);
  const content = pick(article, 'content', locale);

  return (
    <div>
      {/* Page header */}
      <section className="bg-navy py-10 text-white">
        <div className="container">
          <nav aria-label={tc('back')} className="mb-3">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              {t('backToDocs')}
            </Link>
          </nav>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-white/70">{pick(article, 'description', locale)}</p>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav aria-label={t('onThisPage')}>
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('onThisPage')}
              </h2>
              <div className="flex flex-col gap-4">
                {sections.map((section) => (
                  <div key={section.id}>
                    <p className="mb-1.5 px-3 text-[13px] font-semibold text-foreground">
                      {pick(section, 'title', locale)}
                    </p>
                    <ul className="flex flex-col gap-0.5 border-s border-border ps-0">
                      {section.articles.map((a) => {
                        const active = a.slug === article.slug;
                        return (
                          <li key={a.slug}>
                            <Link
                              href={`/docs/${a.slug}`}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors',
                                active
                                  ? 'bg-primary/10 font-medium text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <FileText
                                className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground/50')}
                                aria-hidden="true"
                              />
                              {pick(a, 'title', locale)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>
          </aside>

          {/* Article */}
          <article className="min-w-0 max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[13px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t('readingMinutes', { count: article.reading_minutes })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <Markdown className="text-[15px]">{content}</Markdown>
            </div>

            {/* Prev / Next */}
            <nav className="mt-8 grid gap-4 sm:grid-cols-2" aria-label={t('onThisPage')}>
              {prev ? (
                <Link
                  href={`/docs/${prev.slug}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="mb-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                    {t('prevArticle')}
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {pick(prev, 'title', locale)}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  href={`/docs/${next.slug}`}
                  className="group rounded-2xl border border-border bg-card p-5 text-end transition-colors hover:border-primary/40 sm:col-start-2"
                >
                  <span className="mb-1 flex items-center justify-end gap-1.5 text-[12px] text-muted-foreground">
                    {t('nextArticle')}
                    <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {pick(next, 'title', locale)}
                  </span>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
