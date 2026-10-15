'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { ShoppingCart, Zap, Clock, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCartStore, type CartAddon } from '@/store/cart';
import { computeOrderPricing } from '@/lib/pricing';
import { formatPrice, formatNumber } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export interface PurchasePanelProps {
  service: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string;
    price: number;
    currency: string;
    priceType: 'one_time' | 'monthly';
    deliveryDays: number;
    revisions: number;
    coverImageUrl: string | null;
  };
  addons: CartAddon[];
}

export function ServicePurchasePanel({ service, addons }: PurchasePanelProps) {
  const t = useTranslations();
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedAddonIds, setSelectedAddonIds] = React.useState<string[]>([]);

  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));

  const pricing = computeOrderPricing([
    {
      serviceId: service.id,
      unitPrice: service.price,
      deliveryDays: service.deliveryDays,
      quantity: 1,
      addons: selectedAddons,
    },
  ]);
  const item = pricing.items[0]!;

  function toggleAddon(id: string) {
    setSelectedAddonIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  }

  function addToCart() {
    addItem({
      serviceId: service.id,
      slug: service.slug,
      titleAr: service.titleAr,
      titleEn: service.titleEn,
      price: service.price,
      currency: service.currency,
      priceType: service.priceType,
      deliveryDays: service.deliveryDays,
      quantity: 1,
      coverImageUrl: service.coverImageUrl,
      addons: selectedAddons,
    });
    toast.success(t('common.addToCart'));
  }

  function buyNow() {
    addToCart();
    router.push('/checkout');
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {service.priceType === 'monthly' ? t('service.oneTimePayment') : t('service.oneTimePayment')}
          </p>
          <p className="text-3xl font-bold text-foreground">
            {formatPrice(item.unitTotal, locale, service.currency)}
            {service.priceType === 'monthly' && (
              <span className="ms-1 text-sm font-normal text-muted-foreground">
                / {t('common.perMonth')}
              </span>
            )}
          </p>
        </div>
        <Badge variant="success">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {t('common.deliveryDays', { count: item.deliveryDays })}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {t('common.deliveryTime')}
          </dt>
          <dd className="font-medium text-foreground">
            {t('common.deliveryDays', { count: item.deliveryDays })}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('common.revisions', { count: service.revisions })}
          </dt>
          <dd className="font-medium text-foreground">{formatNumber(service.revisions, locale)}</dd>
        </div>
      </dl>

      {addons.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info className="h-4 w-4 text-primary" aria-hidden="true" />
            {t('service.addons')}
          </legend>
          <p className="text-xs text-muted-foreground">{t('service.addonsHint')}</p>
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <Checkbox
                checked={selectedAddonIds.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
                label={locale === 'ar' ? addon.title_ar : addon.title_en}
                description={
                  addon.extra_days > 0
                    ? `+${formatPrice(addon.price, locale, service.currency)} · +${t('common.deliveryDays', { count: addon.extra_days })}`
                    : `+${formatPrice(addon.price, locale, service.currency)}`
                }
              />
            </div>
          ))}
        </fieldset>
      )}

      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
        <span className="text-sm text-muted-foreground">{t('service.estimatedTotal')}</span>
        <span className="text-xl font-bold text-primary">
          {formatPrice(item.lineTotal, locale, service.currency)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={addToCart}>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {t('service.addSelectedToCart')}
        </Button>
        <Button size="lg" variant="outline" onClick={buyNow}>
          <Zap className="h-4 w-4" aria-hidden="true" />
          {t('service.buySelectedNow')}
        </Button>
      </div>
    </div>
  );
}
