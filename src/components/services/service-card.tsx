import Image from 'next/image';
import { Clock, Check, Star, ArrowUpRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/brand/logo';
import { pick } from '@/lib/utils/pick';
import { formatPrice } from '@/lib/utils/format';
import type { Service } from '@/types/database';
import type { SupportedLocale } from '@/lib/utils/format';

export async function ServiceCard({ service, locale }: { service: Service; locale: SupportedLocale }) {
  setRequestLocale(locale);
  const t = await getTranslations('common');
  const title = pick(service, 'title', locale);
  const shortDesc = pick(service, 'short_desc', locale);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-card transition-all duration-300 hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/20">
      {/* Image Section */}
      <Link href={`/services/${service.slug}`} className="relative block h-40 overflow-hidden">
        {service.cover_image_url ? (
          <Image
            src={service.cover_image_url}
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
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Featured Badge */}
        {service.is_featured && (
          <span className="absolute start-2.5 top-2.5 z-10">
            <Badge variant="gradient" className="text-[10px] px-2 py-0.5">
              <Star className="h-2.5 w-2.5 me-0.5 fill-current" aria-hidden="true" />
              {t('featured')}
            </Badge>
          </span>
        )}

        {/* Quick View */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/services/${service.slug}`}>
          <h3 className="line-clamp-1 text-[15px] font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{shortDesc}</p>

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              {t('deliveryDays', { count: service.delivery_days })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
              {service.price_type === 'monthly' ? t('monthly') : t('oneTime')}
            </span>
          </div>

          {/* Price & Action */}
          <div className="flex items-end justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground">
                {service.price_type === 'monthly' ? t('perMonth') : t('startingFrom')}
              </span>
              <span className="text-lg font-bold text-foreground font-brand tracking-tight leading-none mt-0.5">
                {formatPrice(Number(service.price), locale, service.currency)}
              </span>
            </div>
            <Button size="sm" variant="primary" className="h-8 px-3 text-[12px]" asChild>
              <Link href={`/services/${service.slug}`}>
                {t('viewDetails')}
                <ArrowUpRight className="h-3.5 w-3.5 ms-0.5 opacity-70" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}