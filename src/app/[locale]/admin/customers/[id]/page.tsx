import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/status-badges';
import { getAdminCustomer } from '@/lib/data/admin';
import { formatDate, formatDateTime, formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin.customers');
  const tc = await getTranslations('common');
  const to = await getTranslations('orders');

  const data = await getAdminCustomer(params.id);
  if (!data.profile) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/customers">{t('backToCustomers')}</Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {data.profile.full_name ?? tc('notProvided')}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('search')}</span>
            <span dir="ltr" className="font-medium">
              {data.email || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('date')}</span>
            <span className="font-medium">{formatDate(data.profile.created_at, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('actions')}</span>
            <span dir="ltr" className="font-medium">
              {data.profile.phone ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('services')}</span>
            <span className="font-medium">{data.profile.business_name ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('customerOrders')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{to('orderNumber')}</TableHead>
                <TableHead>{to('orderDate')}</TableHead>
                <TableHead>{to('orderStatus')}</TableHead>
                <TableHead>{to('orderTotal')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell dir="ltr" className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>{formatDateTime(order.created_at, locale)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
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
    </div>
  );
}
