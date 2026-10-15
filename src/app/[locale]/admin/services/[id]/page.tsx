import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ServiceForm } from '@/components/admin/service-form';
import { getAdminCategories, getAdminService } from '@/lib/data/admin';
import type { SupportedLocale } from '@/lib/utils/format';
import type { ServiceInput } from '@/lib/validation';

export default async function AdminEditServicePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [categories, service] = await Promise.all([
    getAdminCategories(),
    getAdminService(params.id),
  ]);

  if (!service) notFound();

  const defaultValues: Partial<ServiceInput> = {
    slug: service.slug,
    categoryId: service.category_id,
    titleAr: service.title_ar,
    titleEn: service.title_en,
    shortDescAr: service.short_desc_ar ?? '',
    shortDescEn: service.short_desc_en ?? '',
    descriptionAr: service.description_ar ?? '',
    descriptionEn: service.description_en ?? '',
    price: Number(service.price),
    currency: service.currency,
    priceType: service.price_type,
    deliveryDays: service.delivery_days,
    revisions: service.revisions,
    featuresAr: ((service.features_ar as unknown as string[]) ?? []),
    featuresEn: ((service.features_en as unknown as string[]) ?? []),
    requirementsAr: ((service.requirements_ar as unknown as string[]) ?? []),
    requirementsEn: ((service.requirements_en as unknown as string[]) ?? []),
    faqs: (service.faqs as unknown as ServiceInput['faqs']) ?? [],
    coverImageUrl: service.cover_image_url,
    isFeatured: service.is_featured,
    isActive: service.is_active,
    sortOrder: service.sort_order,
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t('editService')} — {locale === 'ar' ? service.title_ar : service.title_en}
      </h1>
      <ServiceForm
        categories={categories}
        defaultValues={defaultValues}
        serviceId={service.id}
        existingAddons={service.service_addons}
        coverImageUrl={service.cover_image_url}
      />
    </div>
  );
}
