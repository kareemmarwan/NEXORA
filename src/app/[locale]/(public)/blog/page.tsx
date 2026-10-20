import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search, BookOpen, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { BlogCard } from '@/components/blog/blog-card';
import { getBlog, getBlogTags } from '@/lib/data/blog';
import type { SupportedLocale } from '@/lib/utils/format';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('blog');
  const tc = await getTranslations('common');

  const search = typeof searchParams.search === 'string' ? searchParams.search : null;
  const tag = typeof searchParams.tag === 'string' ? searchParams.tag : null;
  const pageParam = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [tags, blog] = await Promise.all([
    getBlogTags(),
    getBlog({ search, tag, page, pageSize: 9 }),
  ]);

  function buildQuery(overrides: Record<string, string | null>) {
    const params = new URLSearchParams();
    const merged = {
      search,
      tag,
      page: page > 1 ? String(page) : null,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

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
        {/* Search */}
        <div className="mb-6">
          <form method="get" action={`/${locale}/blog`} className="relative w-full max-w-md">
            {tag && <input type="hidden" name="tag" value={tag} />}
            <Search
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={search ?? ''}
              placeholder={t('searchPlaceholder')}
              aria-label={tc('search')}
              className="h-11 w-full rounded-xl border border-input bg-card ps-10 pe-4 text-sm"
            />
          </form>
        </div>

        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link
              href="/blog"
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                !tag
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {t('allTags')}
            </Link>
            {tags.map((value) => {
              const active = tag === value;
              return (
                <Link
                  key={value}
                  href={`/blog${buildQuery({ tag: active ? null : value, page: null })}`}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {value}
                </Link>
              );
            })}
          </div>
        )}

        {/* Active filters */}
        {(search || tag) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('activeFilters')}:</span>
            {search && (
              <Link href={`/blog${buildQuery({ search: null, page: null })}`}>
                <Badge variant="primary">
                  “{search}”
                  <X className="h-3 w-3" aria-hidden="true" />
                </Badge>
              </Link>
            )}
            {tag && (
              <Link href={`/blog${buildQuery({ tag: null, page: null })}`}>
                <Badge variant="primary">
                  {tag}
                  <X className="h-3 w-3" aria-hidden="true" />
                </Badge>
              </Link>
            )}
            <Link href="/blog" className="text-sm text-primary hover:underline">
              {t('clearFilters')}
            </Link>
          </div>
        )}

        {/* Results */}
        {blog.posts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={t('emptyTitle')}
            description={t('emptyDesc')}
            action={
              <Link href="/blog" className="text-sm text-primary hover:underline">
                {t('clearFilters')}
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('resultsCount', { count: blog.total })}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blog.posts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
            {blog.pageCount > 1 && (
              <nav className="mt-10 flex justify-center" aria-label={tc('page')}>
                <ul className="flex flex-wrap items-center gap-2">
                  {Array.from({ length: blog.pageCount }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <li key={n}>
                        <Link
                          href={`/blog${buildQuery({ page: n === 1 ? null : String(n) })}`}
                          aria-current={n === blog.page ? 'page' : undefined}
                          className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-medium ${
                            n === blog.page
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:bg-muted'
                          }`}
                        >
                          {n}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
