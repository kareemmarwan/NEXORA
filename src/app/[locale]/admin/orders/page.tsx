import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/orders/status-badges';
import { EmptyState } from '@/components/ui/empty-state';
import { PackageSearch } from 'lucide-react';
import { getAdminOrders } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';
import type { OrderStatus, PaymentStatus, PaymentMethodType } from '@/types/database';

const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'payment_review',
  'paid',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
];
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'under_review', 'paid', 'failed', 'refunded'];
const PAYMENT_METHODS: PaymentMethodType[] = ['manual', 'stripe'];

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');
  const ts = await getTranslations('status');

  const str = (key: string) => (typeof searchParams[key] === 'string' ? (searchParams[key] as string) : null);

  const filters = {
    search: str('search'),
    status: str('status') as OrderStatus | null,
    paymentStatus: str('payment_status') as PaymentStatus | null,
    paymentMethod: str('payment_method') as PaymentMethodType | null,
    dateFrom: str('date_from'),
    dateTo: str('date_to'),
    page: str('page') ? Number(str('page')) : 1,
  };

  const result = await getAdminOrders(filters);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('orders')}</h1>
      </div>

      <Card>
        <CardContent className="p-5">
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="search" className="mb-1.5 block text-sm font-medium">
                {tc('search')}
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={filters.search ?? ''}
                placeholder={t('searchOrders')}
              />
            </div>

            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                {tc('status')}
              </label>
              <Select id="status" name="status" defaultValue={filters.status ?? ''}>
                <option value="">{t('allStatuses')}</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ts(`order.${s}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="payment_status" className="mb-1.5 block text-sm font-medium">
                {tc('status')}
              </label>
              <Select
                id="payment_status"
                name="payment_status"
                defaultValue={filters.paymentStatus ?? ''}
              >
                <option value="">{t('allPaymentStatuses')}</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ts(`payment.${s}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="payment_method" className="mb-1.5 block text-sm font-medium">
                {t('paymentMethods')}
              </label>
              <Select
                id="payment_method"
                name="payment_method"
                defaultValue={filters.paymentMethod ?? ''}
              >
                <option value="">{t('allPaymentMethods')}</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="date_from" className="mb-1.5 block text-sm font-medium">
                {t('dateFrom')}
              </label>
              <Input
                id="date_from"
                name="date_from"
                type="date"
                defaultValue={filters.dateFrom ?? ''}
              />
            </div>

            <div>
              <label htmlFor="date_to" className="mb-1.5 block text-sm font-medium">
                {t('dateTo')}
              </label>
              <Input id="date_to" name="date_to" type="date" defaultValue={filters.dateTo ?? ''} />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit">{t('applyFilters')}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/orders">{t('resetFilters')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result.orders.length === 0 ? (
        <EmptyState icon={PackageSearch} title={t('noOrders')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc('date')}</TableHead>
                  <TableHead>{t('customerName')}</TableHead>
                  <TableHead>{tc('status')}</TableHead>
                  <TableHead>{tc('total')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                        dir="ltr"
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at, locale)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {order.profiles?.full_name ?? tc('notProvided')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.payment_status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatPrice(Number(order.total), locale, order.currency)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/orders/${order.id}`}>{tc('viewDetails')}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {result.pageCount > 1 && (
        <nav className="flex justify-center gap-2" aria-label={tc('page')}>
          {Array.from({ length: result.pageCount }).map((_, i) => {
            const n = i + 1;
            const query = new URLSearchParams();
            for (const [key, value] of Object.entries(searchParams)) {
              if (typeof value === 'string' && key !== 'page') query.set(key, value);
            }
            query.set('page', String(n));
            return (
              <Link
                key={n}
                href={`/admin/orders?${query.toString()}`}
                aria-current={n === result.page ? 'page' : undefined}
                className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm ${
                  n === result.page
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
