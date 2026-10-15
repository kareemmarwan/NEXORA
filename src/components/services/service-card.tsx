import Image from 'next/image';
import { Clock, Check, Star } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-soft">
      <Link href={`/services/${service.slug}`} className="relative block h-44 overflow-hidden bg-muted">
        {service.cover_image_url ? (
          <Image
            src={service.cover_image_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
            <span className="text-4xl font-bold text-primary/40">AI</span>
          </div>
        )}
        {service.is_featured && (
          <span className="absolute start-3 top-3">
            <Badge variant="warning">
              <Star className="h-3 w-3" aria-hidden="true" />
              {t('featured')}
            </Badge>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/services/${service.slug}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{shortDesc}</p>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t('deliveryDays', { count: service.delivery_days })}
            </Badge>
            <Badge variant="muted">
              <Check className="h-3 w-3" aria-hidden="true" />
              {service.price_type === 'monthly' ? t('monthly') : t('oneTime')}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {service.price_type === 'monthly' ? t('perMonth') : t('startingFrom')}
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatPrice(Number(service.price), locale, service.currency)}
              </span>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/services/${service.slug}`}>{t('viewDetails')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
