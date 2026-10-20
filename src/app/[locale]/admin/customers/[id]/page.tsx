import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/status-badges';
import { CustomerEditForm } from '@/components/admin/customer-edit-form';
import { EmptyState } from '@/components/ui/empty-state';
import { getCurrentUser } from '@/lib/auth/session';
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

  const [data, currentUser] = await Promise.all([
    getAdminCustomer(params.id),
    getCurrentUser(),
  ]);
  if (!data.profile) notFound();

  const isSelf = currentUser?.id === data.profile.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/customers">{t('backToCustomers')}</Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {data.profile.full_name ?? tc('notProvided')}
        </h1>
        <Badge variant={data.profile.role === 'admin' ? 'primary' : 'muted'}>
          {data.profile.role === 'admin' ? t('form.roleAdmin') : t('form.roleCustomer')}
        </Badge>
      </div>

      <CustomerEditForm
        customerId={data.profile.id}
        isSelf={isSelf}
        defaultValues={{
          fullName: data.profile.full_name ?? '',
          phone: data.profile.phone ?? '',
          businessName: data.profile.business_name ?? '',
          role: (data.profile.role as 'customer' | 'admin') ?? 'customer',
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('form.email')}</span>
            <span dir="ltr" className="font-medium">
              {data.email || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{tc('date')}</span>
            <span className="font-medium">{formatDate(data.profile.created_at, locale)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('customerOrders')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.orders.length === 0 ? (
            <div className="p-6">
              <EmptyState title={t('noOrders')} />
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
