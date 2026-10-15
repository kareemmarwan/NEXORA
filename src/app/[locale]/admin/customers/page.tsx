import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';
import { getAdminCustomers } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin.customers');
  const tc = await getTranslations('common');

  const search = typeof searchParams.search === 'string' ? searchParams.search : null;
  const customers = await getAdminCustomers(search);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>

      <Card>
        <CardContent className="p-5">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="search" className="mb-1.5 block text-sm font-medium">
                {tc('search')}
              </label>
              <Input id="search" name="search" defaultValue={search ?? ''} placeholder={t('search')} />
            </div>
            <Button type="submit">{tc('search')}</Button>
            {search && (
              <Button type="button" variant="ghost" asChild>
                <Link href="/admin/customers">{tc('cancel')}</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title={t('empty')} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tc('search')}</TableHead>
                  <TableHead>{t('orderCount')}</TableHead>
                  <TableHead>{t('totalSpent')}</TableHead>
                  <TableHead>{t('joined')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <p className="font-medium">{customer.full_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {customer.email || customer.business_name || ''}
                      </p>
                    </TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>{formatPrice(customer.totalSpent, locale)}</TableCell>
                    <TableCell>{formatDate(customer.created_at, locale)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/admin/customers/${customer.id}`}>{tc('viewDetails')}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
