import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Search, SlidersHorizontal, PackageSearch, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ServiceCard } from '@/components/services/service-card';
import { getCatalog, getCategories, type CatalogSort } from '@/lib/data/services';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';
import type { Metadata } from 'next';

const SORTS: CatalogSort[] = ['featured', 'price_asc', 'price_desc', 'fastest'];

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('catalog');
  const tc = await getTranslations('common');

  const categoryParam = typeof searchParams.category === 'string' ? searchParams.category : null;
  const search = typeof searchParams.search === 'string' ? searchParams.search : null;
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : 'featured';
  const pageParam = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;

  const sort: CatalogSort = SORTS.includes(sortParam as CatalogSort)
    ? (sortParam as CatalogSort)
    : 'featured';
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [categories, catalog] = await Promise.all([
    getCategories(),
    getCatalog({ category: categoryParam, search, sort, page, pageSize: 9 }),
  ]);

  function buildQuery(overrides: Record<string, string | null>) {
    const params = new URLSearchParams();
    const merged = {
      category: categoryParam,
      search,
      sort: sort === 'featured' ? null : sort,
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

      {/* Search + sort */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form method="get" action={`/${locale}/services`} className="relative w-full max-w-md">
          {categoryParam && <input type="hidden" name="category" value={categoryParam} />}
          {sort !== 'featured' && <input type="hidden" name="sort" value={sort} />}
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

        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {SORTS.map((value) => (
            <Link
              key={value}
              href={`/services${buildQuery({ sort: value === 'featured' ? null : value, page: null })}`}
              className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                sort === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {value === 'featured' && t('sortFeatured')}
              {value === 'price_asc' && t('sortPriceAsc')}
              {value === 'price_desc' && t('sortPriceDesc')}
              {value === 'fastest' && t('sortFastest')}
            </Link>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/services${buildQuery({ category: null, page: null })}`}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            !categoryParam
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          {t('allCategories')}
        </Link>
        {categories.map((category) => {
          const active = categoryParam === category.slug;
          return (
            <Link
              key={category.id}
              href={`/services${buildQuery({ category: active ? null : category.slug, page: null })}`}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {pick(category, 'name', locale)}
            </Link>
          );
        })}
      </div>

      {/* Active filters */}
      {(search || categoryParam) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('activeFilters')}:</span>
          {search && (
            <Link href={`/services${buildQuery({ search: null, page: null })}`}>
              <Badge variant="primary">
                “{search}”
                <X className="h-3 w-3" aria-hidden="true" />
              </Badge>
            </Link>
          )}
          {categoryParam && (
            <Link href={`/services${buildQuery({ category: null, page: null })}`}>
              <Badge variant="primary">
                {categories.find((c) => c.slug === categoryParam)
                  ? pick(categories.find((c) => c.slug === categoryParam)!, 'name', locale)
                  : categoryParam}
                <X className="h-3 w-3" aria-hidden="true" />
              </Badge>
            </Link>
          )}
          <Link href="/services" className="text-sm text-primary hover:underline">
            {t('clearFilters')}
          </Link>
        </div>
      )}

      {/* Results */}
      {catalog.services.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button asChild variant="outline">
              <Link href="/services">{t('clearFilters')}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('resultsCount', { count: catalog.total })}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.services.map((service) => (
              <ServiceCard key={service.id} service={service} locale={locale} />
            ))}
          </div>
          <nav className="mt-10 flex justify-center" aria-label={tc('page')}>
            <ul className="flex flex-wrap items-center gap-2">
              {Array.from({ length: catalog.pageCount }).map((_, i) => {
                const n = i + 1;
                return (
                  <li key={n}>
                    <Link
                      href={`/services${buildQuery({ page: n === 1 ? null : String(n) })}`}
                      aria-current={n === catalog.page ? 'page' : undefined}
                      className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl border px-3 text-sm font-medium ${
                        n === catalog.page
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
        </>
      )}
    </div>
    </div>
  );
}
