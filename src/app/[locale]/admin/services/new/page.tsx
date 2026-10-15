import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServiceForm } from '@/components/admin/service-form';
import { getAdminCategories } from '@/lib/data/admin';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AdminNewServicePage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{t('newService')}</h1>
      <ServiceForm categories={categories} />
    </div>
  );
}
