import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/admin/page-header';
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
  const role = typeof searchParams.role === 'string' ? searchParams.role : null;
  const customers = await getAdminCustomers(search, role);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('listDesc')} />

      <Card>
        <CardContent className="p-5">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="search" className="mb-1.5 block text-sm font-medium">
                {tc('search')}
              </label>
              <Input id="search" name="search" defaultValue={search ?? ''} placeholder={t('search')} />
            </div>
            <div className="min-w-[160px]">
              <label htmlFor="role" className="mb-1.5 block text-sm font-medium">
                {t('form.role')}
              </label>
              <Select id="role" name="role" defaultValue={role ?? ''}>
                <option value="">{t('allRoles')}</option>
                <option value="customer">{t('form.roleCustomer')}</option>
                <option value="admin">{t('form.roleAdmin')}</option>
              </Select>
            </div>
            <Button type="submit">{tc('search')}</Button>
            {(search || role) && (
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
                  <TableHead>{t('customerName')}</TableHead>
                  <TableHead>{t('form.role')}</TableHead>
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
                    <TableCell>
                      <Badge variant={customer.role === 'admin' ? 'primary' : 'muted'}>
                        {customer.role === 'admin' ? t('form.roleAdmin') : t('form.roleCustomer')}
                      </Badge>
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
