'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Upload, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceCard } from '@/components/services/service-card';
import { createAdminSchemas, type ServiceInput } from '@/lib/validation';
import { slugify } from '@/lib/utils/cn';
import type { Category, ServiceAddon } from '@/types/database';

type FormValues = ServiceInput;

export function ServiceForm({
  categories,
  defaultValues,
  serviceId,
  existingAddons,
  coverImageUrl,
}: {
  categories: Category[];
  defaultValues?: Partial<FormValues>;
  serviceId?: string;
  existingAddons?: ServiceAddon[];
  coverImageUrl?: string | null;
}) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale();
  const router = useRouter();
  const [cover, setCover] = React.useState<string | null>(coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = React.useState(false);

  const schemas = React.useMemo(() => createAdminSchemas((key) => t(key)), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas.serviceSchema),
    defaultValues: {
      slug: '',
      categoryId: categories[0]?.id ?? null,
      titleAr: '',
      titleEn: '',
      shortDescAr: '',
      shortDescEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: 0,
      currency: 'USD',
      priceType: 'one_time',
      deliveryDays: 5,
      revisions: 2,
      featuresAr: [],
      featuresEn: [],
      requirementsAr: [],
      requirementsEn: [],
      faqs: [],
      coverImageUrl: coverImageUrl ?? null,
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
      addons: existingAddons?.map((a) => ({
        id: a.id,
        titleAr: a.title_ar,
        titleEn: a.title_en,
        price: Number(a.price),
        extraDays: a.extra_days,
        isActive: a.is_active,
      })) ?? [],
      ...defaultValues,
    },
  });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({ control: form.control, name: 'faqs' });
  const {
    fields: addonFields,
    append: appendAddon,
    remove: removeAddon,
  } = useFieldArray({ control: form.control, name: 'addons' });

  async function onUploadCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(te('imageTooLarge'));
        return;
      }
      setCover(data.url);
      form.setValue('coverImageUrl', data.url);
    } catch {
      toast.error(te('generic'));
    } finally {
      setUploadingCover(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      id: serviceId,
      coverImageUrl: cover,
    };

    const res = await fetch('/api/admin/services', {
      method: serviceId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error === 'invalid_input' ? te('validation') : te('generic'));
      return;
    }

    toast.success(t('serviceForm.saveService'));
    router.push('/admin/services');
    router.refresh();
  }

  const watchTitleEn = form.watch('titleEn');

  React.useEffect(() => {
    if (!serviceId && watchTitleEn) {
      const current = form.getValues('slug');
      if (!current) form.setValue('slug', slugify(watchTitleEn));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTitleEn, serviceId]);

  const previewService = {
    id: serviceId ?? 'preview',
    slug: form.watch('slug') || 'preview',
    title_ar: form.watch('titleAr'),
    title_en: form.watch('titleEn'),
    short_desc_ar: form.watch('shortDescAr'),
    short_desc_en: form.watch('shortDescEn'),
    price: Number(form.watch('price') ?? 0),
    currency: form.watch('currency') ?? 'USD',
    price_type: form.watch('priceType') ?? 'one_time',
    delivery_days: Number(form.watch('deliveryDays') ?? 5),
    revisions: Number(form.watch('revisions') ?? 2),
    is_featured: form.watch('isFeatured'),
    is_active: true,
    cover_image_url: cover,
    sort_order: 0,
    category_id: null,
    created_at: '',
    updated_at: '',
    description_ar: null,
    description_en: null,
    features_ar: null,
    features_en: null,
    requirements_ar: null,
    requirements_en: null,
    faqs: null,
  } as never;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.titles')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="titleAr" required>
                  {t('serviceForm.titleAr')}
                </Label>
                <Input id="titleAr" invalid={!!form.formState.errors.titleAr} {...form.register('titleAr')} />
                {form.formState.errors.titleAr && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.titleAr.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="titleEn" required>
                  {t('serviceForm.titleEn')}
                </Label>
                <Input id="titleEn" dir="ltr" invalid={!!form.formState.errors.titleEn} {...form.register('titleEn')} />
              </div>
              <div>
                <Label htmlFor="slug" required>
                  {t('serviceForm.slug')}
                </Label>
                <Input id="slug" dir="ltr" invalid={!!form.formState.errors.slug} {...form.register('slug')} />
                <p className="mt-1 text-xs text-muted-foreground">{t('serviceForm.slugHint')}</p>
              </div>
              <div>
                <Label htmlFor="categoryId">{t('serviceForm.category')}</Label>
                <Select id="categoryId" {...form.register('categoryId')}>
                  <option value="">—</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {locale === 'ar' ? category.name_ar : category.name_en}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="shortDescAr">{t('serviceForm.shortDescAr')}</Label>
                <Textarea id="shortDescAr" rows={2} {...form.register('shortDescAr')} />
              </div>
              <div>
                <Label htmlFor="shortDescEn">{t('serviceForm.shortDescEn')}</Label>
                <Textarea id="shortDescEn" rows={2} dir="ltr" {...form.register('shortDescEn')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="descriptionAr">{t('serviceForm.descriptionAr')}</Label>
                <Textarea id="descriptionAr" rows={6} {...form.register('descriptionAr')} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="descriptionEn">{t('serviceForm.descriptionEn')}</Label>
                <Textarea id="descriptionEn" rows={6} dir="ltr" {...form.register('descriptionEn')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.pricing')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="price" required>
                  {t('serviceForm.price')}
                </Label>
                <Input id="price" type="number" step="0.01" min="0" dir="ltr" {...form.register('price')} />
              </div>
              <div>
                <Label htmlFor="currency">{t('serviceForm.currency')}</Label>
                <Input id="currency" dir="ltr" {...form.register('currency')} />
              </div>
              <div>
                <Label htmlFor="priceType">{t('serviceForm.priceType')}</Label>
                <Select id="priceType" {...form.register('priceType')}>
                  <option value="one_time">{tc('oneTime')}</option>
                  <option value="monthly">{tc('monthly')}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="deliveryDays" required>
                  {t('serviceForm.deliveryDays')}
                </Label>
                <Input id="deliveryDays" type="number" min="1" dir="ltr" {...form.register('deliveryDays')} />
              </div>
              <div>
                <Label htmlFor="revisions">{t('serviceForm.revisions')}</Label>
                <Input id="revisions" type="number" min="0" dir="ltr" {...form.register('revisions')} />
              </div>
              <div>
                <Label htmlFor="sortOrder">{t('serviceForm.sortOrder')}</Label>
                <Input id="sortOrder" type="number" min="0" dir="ltr" {...form.register('sortOrder')} />
              </div>
            </CardContent>
          </Card>

          {/* Features & requirements lists */}
          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.features')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <StringList
                label={`${t('serviceForm.features')} (AR)`}
                name="featuresAr"
                form={form}
              />
              <StringList
                label={`${t('serviceForm.features')} (EN)`}
                name="featuresEn"
                form={form}
              />
              <StringList
                label={`${t('serviceForm.requirements')} (AR)`}
                name="requirementsAr"
                form={form}
              />
              <StringList
                label={`${t('serviceForm.requirements')} (EN)`}
                name="requirementsEn"
                form={form}
              />
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.faqs')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {faqFields.map((field, index) => (
                <div key={field.id} className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFaq(index)}
                      aria-label={t('serviceForm.removeFaq')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>{t('serviceForm.faqQuestionAr')}</Label>
                      <Textarea rows={2} {...form.register(`faqs.${index}.q_ar`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.faqQuestionEn')}</Label>
                      <Textarea rows={2} dir="ltr" {...form.register(`faqs.${index}.q_en`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.faqAnswerAr')}</Label>
                      <Textarea rows={3} {...form.register(`faqs.${index}.a_ar`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.faqAnswerEn')}</Label>
                      <Textarea rows={3} dir="ltr" {...form.register(`faqs.${index}.a_en`)} />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendFaq({ q_ar: '', a_ar: '', q_en: '', a_en: '' })
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('serviceForm.addFaq')}
              </Button>
            </CardContent>
          </Card>

          {/* Add-ons */}
          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.addons')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {addonFields.map((field, index) => (
                <div key={field.id} className="rounded-xl border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAddon(index)}
                      aria-label={t('serviceForm.removeAddon')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>{t('serviceForm.addonTitleAr')}</Label>
                      <Input {...form.register(`addons.${index}.titleAr`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.addonTitleEn')}</Label>
                      <Input dir="ltr" {...form.register(`addons.${index}.titleEn`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.addonPrice')}</Label>
                      <Input type="number" step="0.01" min="0" dir="ltr" {...form.register(`addons.${index}.price`)} />
                    </div>
                    <div>
                      <Label>{t('serviceForm.addonExtraDays')}</Label>
                      <Input type="number" min="0" dir="ltr" {...form.register(`addons.${index}.extraDays`)} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Checkbox
                      checked={form.watch(`addons.${index}.isActive`) ?? true}
                      onChange={(e) => form.setValue(`addons.${index}.isActive`, e.target.checked)}
                      label={tc('yes')}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendAddon({
                    titleAr: '',
                    titleEn: '',
                    price: 0,
                    extraDays: 0,
                    isActive: true,
                  })
                }
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('serviceForm.addAddon')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: cover + settings + preview */}
        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.coverImage')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="cover" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">{t('serviceForm.coverImageHint')}</span>
                )}
              </div>
              <label className="inline-flex">
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onUploadCover} />
                <Button type="button" variant="outline" loading={uploadingCover} onClick={(e) => (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.click()}>
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t('serviceForm.uploadCover')}
                </Button>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Checkbox
                checked={form.watch('isActive') ?? true}
                onChange={(e) => form.setValue('isActive', e.target.checked)}
                label={t('serviceForm.isActive')}
              />
              <Checkbox
                checked={form.watch('isFeatured') ?? false}
                onChange={(e) => form.setValue('isFeatured', e.target.checked)}
                label={t('serviceForm.isFeatured')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('serviceForm.preview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ServiceCard service={previewService} locale={locale === 'en' ? 'en' : 'ar'} />
            </CardContent>
          </Card>

          <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {serviceId ? t('serviceForm.saveService') : t('serviceForm.createService')}
          </Button>
        </aside>
      </div>
    </form>
  );
}

function StringList({
  label,
  name,
  form,
}: {
  label: string;
  name: 'featuresAr' | 'featuresEn' | 'requirementsAr' | 'requirementsEn';
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  const t = useTranslations('admin');
  const values = form.watch(name) ?? [];

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input {...form.register(`${name}.${index}` as never)} />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={t('serviceForm.removeAddon')}
              onClick={() =>
                form.setValue(
                  name,
                  values.filter((_, i) => i !== index)
                )
              }
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        onClick={() => form.setValue(name, [...(values ?? []), ''])}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t('serviceForm.addFeature')}
      </Button>
    </div>
  );
}
