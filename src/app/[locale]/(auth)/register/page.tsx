'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { createAuthSchemas, type RegisterInput } from '@/lib/validation';

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(schemas.registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      businessName: '',
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone ?? '',
          business_name: values.businessName ?? '',
          preferred_locale: locale,
        },
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setServerError(t('errors.generic'));
      return;
    }

    toast.success(t('auth.welcomeBack', { name: values.fullName }));
    router.push('/');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.registerTitle')}</CardTitle>
        <CardDescription>{t('auth.registerSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4">
            <Alert variant="error">{serverError}</Alert>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div>
            <Label htmlFor="fullName" required>
              {t('auth.fullName')}
            </Label>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder={t('auth.fullNamePlaceholder')}
              invalid={!!form.formState.errors.fullName}
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" required>
              {t('auth.email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              invalid={!!form.formState.errors.email}
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">{t('auth.phoneOptional')}</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
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
            <Label htmlFor="businessName">{t('auth.businessNameOptional')}</Label>
            <Input
              id="businessName"
              autoComplete="organization"
              placeholder={t('auth.businessNamePlaceholder')}
              invalid={!!form.formState.errors.businessName}
              {...form.register('businessName')}
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              {t('auth.password')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>
              {t('auth.confirmPassword')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              invalid={!!form.formState.errors.confirmPassword}
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
            {t('auth.registerCta')}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">{t('auth.termsNote')}</p>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t('auth.loginCta')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
