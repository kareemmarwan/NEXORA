'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { createAuthSchemas, type ForgotPasswordInput } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [sent, setSent] = React.useState(false);

  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schemas.forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${origin}/reset-password`,
    });
    if (!error) {
      setSent(true);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.resetTitle')}</CardTitle>
        <CardDescription>{t('auth.resetSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col gap-5">
            <Alert variant="success">{t('auth.resetSent')}</Alert>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">{t('auth.backToLogin')}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
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
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
              {t('auth.resetCta')}
            </Button>

            <p className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
