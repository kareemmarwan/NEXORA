import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Star, Check, X } from 'lucide-react';
import { getAdminServices } from '@/lib/data/admin';
import { formatPrice } from '@/lib/utils/format';
import { pick } from '@/lib/utils/pick';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AdminServicesPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tc = await getTranslations('common');

  const services = await getAdminServices();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('serviceList')}</h1>
        <Button asChild>
          <Link href="/admin/services/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('newService')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc('services')}</TableHead>
                <TableHead>{t('categories')}</TableHead>
                <TableHead>{tc('price')}</TableHead>
                <TableHead>{tc('status')}</TableHead>
                <TableHead>{t('featureToggle')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {pick(service, 'title', locale)}
                    </Link>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {service.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    {service.categories ? pick(service.categories, 'name', locale) : '—'}
                  </TableCell>
                  <TableCell>{formatPrice(Number(service.price), locale, service.currency)}</TableCell>
                  <TableCell>
                    {service.is_active ? (
                      <Badge variant="success">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {t('activate')}
                      </Badge>
                    ) : (
                      <Badge variant="muted">
                        <X className="h-3 w-3" aria-hidden="true" />
                        {t('deactivate')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.is_featured && (
                      <Badge variant="warning">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        {t('featureToggle')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/services/${service.id}`}>{tc('edit')}</Link>
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
