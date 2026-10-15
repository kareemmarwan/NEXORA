'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { createAuthSchemas, type ProfileInput } from '@/lib/validation';

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { fullName: string; phone: string; businessName: string; preferredLocale: 'ar' | 'en' };
}) {
  const t = useTranslations();
  const locale = useLocale();
  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(schemas.profileSchema),
    defaultValues,
  });

  async function onSubmit(values: ProfileInput) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.fullName,
        phone: values.phone || null,
        business_name: values.businessName || null,
        preferred_locale: values.preferredLocale,
      })
      .eq('id', user.id);

    if (error) {
      toast.error(t('errors.generic'));
      return;
    }
    toast.success(t('account.profileSaved'));
    window.location.href = `/${values.preferredLocale}/account`;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="fullName" required>
          {t('auth.fullName')}
        </Label>
        <Input
          id="fullName"
          invalid={!!form.formState.errors.fullName}
          {...form.register('fullName')}
        />
        {form.formState.errors.fullName && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">{t('auth.phone')}</Label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          placeholder={t('auth.phonePlaceholder')}
          invalid={!!form.formState.errors.phone}
          {...form.register('phone')}
        />
        {form.formState.errors.phone && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="businessName">{t('auth.businessName')}</Label>
        <Input
          id="businessName"
          placeholder={t('auth.businessNamePlaceholder')}
          {...form.register('businessName')}
        />
      </div>

      <div>
        <Label htmlFor="preferredLocale">{t('account.preferredLanguage')}</Label>
        <Select id="preferredLocale" {...form.register('preferredLocale')}>
          <option value="ar" selected={locale === 'ar'}>
            العربية
          </option>
          <option value="en" selected={locale === 'en'}>
            English
          </option>
        </Select>
      </div>

      <Button type="submit" loading={form.formState.isSubmitting} className="w-fit">
        {t('account.saveProfile')}
      </Button>
    </form>
  );
}
