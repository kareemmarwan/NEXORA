import Image from 'next/image';
import { Clock, ArrowUpRight, CalendarDays } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LogoMark } from '@/components/brand/logo';
import { pick } from '@/lib/utils/pick';
import { formatDate } from '@/lib/utils/format';
import type { BlogPost } from '@/types/database';
import type { SupportedLocale } from '@/lib/utils/format';

export async function BlogCard({ post, locale }: { post: BlogPost; locale: SupportedLocale }) {
  setRequestLocale(locale);
  const t = await getTranslations('blog');
  const title = pick(post, 'title', locale);
  const excerpt = pick(post, 'excerpt', locale);
  const tags = Array.isArray(post.tags) ? (post.tags as string[]) : [];
  const date = post.published_at ?? post.created_at;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-card transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20">
      <Link href={`/blog/${post.slug}`} className="relative block h-40 overflow-hidden">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <LogoMark title={null} className="h-16 w-16 opacity-10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-relaxed text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{excerpt}</p>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06] text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(date, locale)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {t('readingMinutes', { count: post.reading_minutes })}
          </span>
        </div>
      </div>
    </article>
  );
}
