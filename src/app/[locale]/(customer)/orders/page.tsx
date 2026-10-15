import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PackageSearch, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { OrderStatusBadge } from '@/components/orders/status-badges';
import { requireUser } from '@/lib/auth/session';
import { getMyOrders } from '@/lib/data/orders';
import { formatDate, formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function OrdersPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('orders');

  const orders = await getMyOrders(user.id);
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button asChild>
              <Link href="/services">{t('emptyAction')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground" dir="ltr">
                      {order.order_number}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>
                      {t('orderDate')}: {formatDate(order.created_at, locale)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t('orderTotal')}: {formatPrice(Number(order.total), locale, order.currency)}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${order.id}`}>
                    {t('viewOrder')}
                    <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
