'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCartStore } from '@/store/cart';
import { computeOrderPricing } from '@/lib/pricing';
import { formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export default function CartPage() {
  const t = useTranslations('cart');
  const tc = useTranslations('common');
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const { items, removeItem, setQuantity, setAddons } = useCartStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="container py-10">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const pricing = computeOrderPricing(
    items.map((item) => ({
      serviceId: item.serviceId,
      unitPrice: item.price,
      deliveryDays: item.deliveryDays,
      quantity: item.quantity,
      addons: item.addons.map((a) => ({ id: a.id, price: a.price, extra_days: a.extra_days })),
    }))
  );

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  if (items.length === 0) {
    return (
      <div className="container py-14">
        <EmptyState
          icon={ShoppingCart}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button asChild>
              <Link href="/services">{t('emptyAction')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('itemsCount', { count: items.length })} — {t('subtitle')}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item, index) => {
            const line = pricing.items[index]!;
            const title = locale === 'ar' ? item.titleAr : item.titleEn;
            return (
              <article
                key={item.serviceId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row"
              >
                <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 sm:w-32">
                  <span className="text-2xl font-bold text-primary/40">AI</span>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/services/${item.slug}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.serviceId)}
                      aria-label={t('removeItem')}
                      className="tap-target rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  {item.addons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.addons.map((addon) => (
                        <Badge key={addon.id} variant="muted">
                          {locale === 'ar' ? addon.title_ar : addon.title_en}
                          <button
                            type="button"
                            aria-label={tc('remove')}
                            onClick={() =>
                              setAddons(
                                item.serviceId,
                                item.addons.filter((a) => a.id !== addon.id)
                              )
                            }
                            className="ms-1 text-muted-foreground hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.serviceId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={tc('quantity') + ' -'}
                        className="tap-target rounded-lg border border-border disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.serviceId, item.quantity + 1)}
                        disabled={item.quantity >= 5}
                        aria-label={tc('quantity') + ' +'}
                        className="tap-target rounded-lg border border-border disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(line.unitTotal, locale, item.currency)} × {line.quantity}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(line.lineTotal, locale, item.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tc('deliveryDays', { count: line.deliveryDays })}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Summary */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('orderSummary')}</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{tc('subtotal')}</dt>
                <dd className="font-medium">
                  {formatPrice(pricing.subtotal, locale, pricing.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{tc('deliveryTime')}</dt>
                <dd className="font-medium">{tc('deliveryDays', { count: pricing.maxDeliveryDays })}</dd>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <dt className="font-semibold">{tc('total')}</dt>
                <dd className="text-xl font-bold text-primary">
                  {formatPrice(pricing.total, locale, pricing.currency)}
                </dd>
              </div>
            </dl>

            <Button size="lg" className="mt-5 w-full" onClick={() => router.push('/checkout')}>
              {t('proceedToCheckout')}
              <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Button>

            <Button variant="ghost" className="mt-2 w-full" asChild>
              <Link href="/services">{tc('continueShopping')}</Link>
            </Button>

            <p className="mt-4 text-xs text-muted-foreground">{t('priceNote')}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
