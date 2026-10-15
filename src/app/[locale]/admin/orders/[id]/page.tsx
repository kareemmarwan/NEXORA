import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, UserRound } from 'lucide-react';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from '@/components/orders/status-badges';
import { OrderStatusForm } from '@/components/admin/order-status-form';
import { ProofReview } from '@/components/admin/proof-review';
import { getAdminOrder } from '@/lib/data/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils/format';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';
import type { OrderItemAddonSnapshot, BriefAnswers } from '@/types/database';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');
  const to = await getTranslations('orders');

  const order = await getAdminOrder(params.id);
  if (!order) notFound();

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  const brief = (order.brief ?? {}) as { answers?: BriefAnswers; contact_phone?: string };
  const answers = brief.answers ?? {};

  // Signed URLs for payment proofs (short expiry).
  const admin = createAdminClient();
  const signedUrls = await Promise.all(
    order.payment_proofs.map(async (proof) => {
      const { data } = await admin.storage
        .from('payment-proofs')
        .createSignedUrl(proof.file_path, 300);
      return data?.signedUrl ?? null;
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              {t('orders')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground" dir="ltr">
            {order.order_number}
          </h1>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.payment_status} />
        </div>
        <p className="text-lg font-bold">
          {formatPrice(Number(order.total), locale, order.currency)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{to('items')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {order.order_items.map((item) => {
                const addons = (item.addons as unknown as OrderItemAddonSnapshot[]) ?? [];
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">{pick(item, 'title_snapshot', locale)}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="muted">×{item.quantity}</Badge>
                        <Badge variant="muted">
                          {tc('deliveryDays', { count: item.delivery_days })}
                        </Badge>
                        {addons.map((addon) => (
                          <Badge key={addon.id} variant="outline">
                            +{locale === 'ar' ? addon.title_ar : addon.title_en}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(Number(item.unit_price) * item.quantity, locale, order.currency)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Brief */}
          <Card>
            <CardHeader>
              <CardTitle>{to('brief')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {order.order_items.map((item) => {
                const entry = item.service_id ? answers[item.service_id] : null;
                if (!entry) return null;
                return (
                  <div key={item.id} className="rounded-xl border border-border p-4">
                    <p className="mb-2 font-medium">{pick(item, 'title_snapshot', locale)}</p>
                    <ul className="flex flex-col gap-1.5">
                      {entry.answers.map((answer, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {to('requirementLabel', { index: index + 1 })}:
                          </span>{' '}
                          {answer}
                        </li>
                      ))}
                    </ul>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                );
              })}
              {order.customer_notes && (
                <div className="rounded-xl bg-muted/50 p-3 text-sm">
                  <span className="font-medium">{to('customerNotes')}:</span> {order.customer_notes}
                </div>
              )}
              {brief.contact_phone && (
                <p className="text-sm text-muted-foreground">
                  {t('customerPhone')}: <span dir="ltr">{brief.contact_phone}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Proofs */}
          <Card>
            <CardHeader>
              <CardTitle>{t('paymentProofs')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProofReview
                orderId={order.id}
                proofs={order.payment_proofs}
                signedUrls={signedUrls}
              />
            </CardContent>
          </Card>

          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            deliveryNotes={order.delivery_notes ?? ''}
            internalNotes={order.internal_notes ?? ''}
          />
        </div>

        <aside className="flex flex-col gap-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('customerInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customerName')}</span>
                <span className="font-medium">{order.profiles?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customerPhone')}</span>
                <span dir="ltr" className="font-medium">
                  {order.profiles?.phone ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('customerBusiness')}</span>
                <span className="font-medium">{order.profiles?.business_name ?? '—'}</span>
              </div>
              {order.profiles?.id && (
                <Button size="sm" variant="outline" asChild className="mt-2">
                  <Link href={`/admin/customers/${order.profiles.id}`}>
                    {tc('viewDetails')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order meta */}
          <Card>
            <CardHeader>
              <CardTitle>{to('paymentSection')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tc('status')}</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{to('orderDate')}</span>
                <span>{formatDateTime(order.created_at, locale)}</span>
              </div>
              {order.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{to('paidAt')}</span>
                  <span>{formatDateTime(order.paid_at, locale)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{to('deliveredAt')}</span>
                  <span>{formatDate(order.delivered_at, locale)}</span>
                </div>
              )}
              {order.payment_methods && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('paymentMethods')}</span>
                  <span>{pick(order.payment_methods, 'label', locale)}</span>
                </div>
              )}
              {order.stripe_session_id && (
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {order.stripe_session_id}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{to('timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3">
                {order.order_events.map((event) => (
                  <li key={event.id} className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.created_at, locale)}
                    </span>
                    {event.message && (
                      <span className="text-xs text-muted-foreground">{event.message}</span>
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
