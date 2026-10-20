import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Clock, CalendarDays, UserRound, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/ui/markdown';
import { BlogCard } from '@/components/blog/blog-card';
import { getPostBySlug, getRelatedPosts } from '@/lib/data/blog';
import { pick } from '@/lib/utils/pick';
import { formatDate } from '@/lib/utils/format';
import { absoluteUrl } from '@/lib/utils/cn';
import type { SupportedLocale } from '@/lib/utils/format';
import type { BlogPost } from '@/types/database';

type Props = {
  params: { locale: string; slug: string };
};

function postTags(post: BlogPost): string[] {
  return Array.isArray(post.tags) ? (post.tags as string[]) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Not found' };

  const title = pick(post, 'title', locale);
  const description = pick(post, 'excerpt', locale);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(`/${locale}/blog/${post.slug}`),
      languages: {
        ar: absoluteUrl(`/ar/blog/${post.slug}`),
        en: absoluteUrl(`/en/blog/${post.slug}`),
      },
    },
    openGraph: {
      title,
      description,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);

  const post = await getPostBySlug(params.slug);
  if (!post || !post.is_published) notFound();

  const t = await getTranslations('blog');
  const tc = await getTranslations('common');

  const title = pick(post, 'title', locale);
  const content = pick(post, 'content', locale) || pick(post, 'excerpt', locale);
  const tags = postTags(post);
  const date = post.published_at ?? post.created_at;

  const related = await getRelatedPosts(post.slug, tags, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: pick(post, 'excerpt', locale),
    url: absoluteUrl(`/${locale}/blog/${post.slug}`),
    image: post.cover_image_url ?? undefined,
    datePublished: date,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: post.author_name ?? 'NEXORA',
    },
  };

  return (
    <div className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label={tc('back')} className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('backToBlog')}
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold leading-snug text-foreground md:text-3xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{pick(post, 'excerpt', locale)}</p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
            {post.author_name && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {post.author_name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {formatDate(date, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {t('readingMinutes', { count: post.reading_minutes })}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="primary">{tag}</Badge>
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Cover */}
        <div className="relative mb-8 h-64 overflow-hidden rounded-2xl border border-border bg-muted md:h-80">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
              <span className="text-6xl font-bold text-primary/40">AI</span>
            </div>
          )}
        </div>

        {/* Content */}
        {content && <Markdown className="text-[15px]">{content}</Markdown>}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t('relatedPosts')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <BlogCard key={r.id} post={r} locale={locale} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 text-center">
        <Button variant="outline" asChild>
          <Link href="/blog">{t('backToBlog')}</Link>
        </Button>
      </div>
    </div>
  );
}
