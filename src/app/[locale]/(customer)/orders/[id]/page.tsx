import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  ArrowRight,
  ArrowLeft,
  CircleDot,
  Clock,
  CreditCard,
  FileText,
  PackageCheck,
  MessageSquareText,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/ui/markdown';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  ProofStatusBadge,
} from '@/components/orders/status-badges';
import { ProofUploadPanel } from '@/components/orders/proof-upload';
import { OrderActions } from '@/components/orders/order-actions';
import { requireUser } from '@/lib/auth/session';
import { getOrderForUser, computeExpectedDeliveryDate, getSignedProofUrl } from '@/lib/data/orders';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils/format';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';
import type { BriefAnswers, OrderItemAddonSnapshot } from '@/types/database';

const EVENT_LABELS: Record<string, string> = {
  created: 'eventCreated',
  proof_uploaded: 'eventProofUploaded',
  payment_confirmed: 'eventPaymentConfirmed',
  status_changed: 'eventStatusChanged',
  delivered: 'eventDelivered',
  cancelled: 'eventCancelled',
  refunded: 'eventRefunded',
  completed: 'eventCompleted',
  paid: 'eventPaid',
};

export default async function OrderDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('orders');
  const tc = await getTranslations('common');

  const order = await getOrderForUser(params.id, user.id);
  if (!order) notFound();

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;
  const brief = (order.brief ?? {}) as {
    answers?: BriefAnswers;
    contact_phone?: string;
  };
  const answers = brief.answers ?? {};

  const maxDeliveryDays = order.order_items.reduce(
    (max, item) => Math.max(max, item.delivery_days),
    0
  );
  const expectedDelivery = computeExpectedDeliveryDate(order.paid_at, maxDeliveryDays);

  const latestProof = order.payment_proofs[order.payment_proofs.length - 1] ?? null;
  const latestProofUrl = latestProof ? await getSignedProofUrl(latestProof.file_path) : null;

  const canCancel = order.status === 'pending_payment';
  const canComplete = order.status === 'delivered';
  const canUploadProof =
    order.payment_method_type === 'manual' &&
    (order.status === 'pending_payment' || order.status === 'payment_review');
  const canPayOnline =
    order.payment_method_type === 'stripe' &&
    (order.status === 'pending_payment' || order.status === 'payment_review') &&
    order.payment_status !== 'paid';

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">
            <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            {t('backToOrders')}
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground" dir="ltr">
              {order.order_number}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('orderDate')}: {formatDateTime(order.created_at, locale)}
          </p>
        </div>
        <div className="text-end">
          <p className="text-sm text-muted-foreground">{t('orderTotal')}</p>
          <p className="text-2xl font-bold text-primary">
            {formatPrice(Number(order.total), locale, order.currency)}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('items')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.order_items.map((item) => {
                const addons = (item.addons as unknown as OrderItemAddonSnapshot[]) ?? [];
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {pick(item, 'title_snapshot', locale)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
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

              <dl className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tc('subtotal')}</dt>
                  <dd>{formatPrice(Number(order.subtotal), locale, order.currency)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>{tc('total')}</dt>
                  <dd>{formatPrice(Number(order.total), locale, order.currency)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Brief */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('brief')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.order_items.map((item) => {
                const entry = item.service_id ? answers[item.service_id] : null;
                if (!entry) return null;
                return (
                  <div key={item.id} className="rounded-xl border border-border p-4">
                    <p className="mb-2 font-medium">
                      {pick(item, 'title_snapshot', locale)}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {entry.answers.map((answer, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {t('requirementLabel', { index: index + 1 })}:
                          </span>{' '}
                          {answer}
                        </li>
                      ))}
                    </ul>
                    {entry.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tc('andMore')}: {entry.notes}
                      </p>
                    )}
                  </div>
                );
              })}

              {order.customer_notes && (
                <div className="rounded-xl bg-muted/50 p-4 text-sm">
                  <p className="mb-1 font-medium">{t('customerNotes')}</p>
                  <p className="text-muted-foreground">{order.customer_notes}</p>
                </div>
              )}

              {brief.contact_phone && (
                <p className="text-sm text-muted-foreground">
                  {t('customerNotes')} — <span dir="ltr">{brief.contact_phone}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delivery */}
          {(order.status === 'delivered' || order.status === 'completed') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-success" aria-hidden="true" />
                  {t('deliverySection')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.delivery_notes ? (
                  <Markdown>{order.delivery_notes}</Markdown>
                ) : (
                  <p className="text-sm text-muted-foreground">{tc('notProvided')}</p>
                )}
                {order.delivered_at && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t('deliveredAt')}: {formatDateTime(order.delivered_at, locale)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <OrderActions
            orderId={order.id}
            canCancel={canCancel}
            canComplete={canComplete}
            canPayOnline={canPayOnline}
          />
        </div>

        <aside className="flex flex-col gap-6">
          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                {t('paymentSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{tc('status')}</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>

              {order.paid_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('paidAt')}</span>
                  <span>{formatDateTime(order.paid_at, locale)}</span>
                </div>
              )}

              {order.payment_method_type === 'manual' && order.payment_methods && (
                <div className="rounded-xl border border-border p-4">
                  <p className="mb-2 text-sm font-medium">
                    {t('paymentInstructionsTitle')}
                  </p>
                  <p className="mb-2 text-sm">{pick(order.payment_methods, 'label', locale)}</p>
                  {(order.payment_methods.details_ar || order.payment_methods.details_en) && (
                    <div className="whitespace-pre-line rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                      {locale === 'ar'
                        ? order.payment_methods.details_ar
                        : order.payment_methods.details_en}
                    </div>
                  )}
                </div>
              )}

              {order.payment_method_type === 'manual' && (
                <ProofUploadPanel
                  orderId={order.id}
                  proofs={order.payment_proofs}
                  canUpload={canUploadProof}
                />
              )}

              {latestProof && (
                <div className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {t('downloadProof')}
                  </span>
                  <div className="flex items-center gap-2">
                    <ProofStatusBadge status={latestProof.status} />
                    {latestProofUrl && (
                      <a
                        href={latestProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expected delivery */}
          {expectedDelivery && (
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('expectedDelivery')}</p>
                  <p className="font-semibold">{formatDate(expectedDelivery, locale)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t('timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4">
                {order.order_events.map((event) => {
                  const labelKey = EVENT_LABELS[event.type] ?? 'eventStatusChanged';
                  return (
                    <li key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
                        <div className="h-full w-px bg-border" aria-hidden="true" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 pb-2">
                        <p className="text-sm font-medium">{t(labelKey as 'eventCreated')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.created_at, locale)}
                        </p>
                        {event.from_status && event.to_status && (
                          <p className="text-xs text-muted-foreground">
                            {event.from_status} → {event.to_status}
                          </p>
                        )}
                        {event.message && (
                          <p className="text-sm text-muted-foreground">{event.message}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
