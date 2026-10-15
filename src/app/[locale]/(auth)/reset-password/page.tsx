'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import { createAuthSchemas, type ResetPasswordInput } from '@/lib/validation';

export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message);
      return;
    }
    setDone(true);
    toast.success(t('auth.passwordUpdated'));
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.resetTitle')}</CardTitle>
        <CardDescription>{t('auth.newPassword')}</CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4">
            <Alert variant="error">{serverError}</Alert>
          </div>
        )}
        {done && (
          <div className="mb-4">
            <Alert variant="success">{t('auth.passwordUpdated')}</Alert>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div>
            <Label htmlFor="password" required>
              {t('auth.newPassword')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              invalid={!!form.formState.errors.password}
              {...form.register('password')}
            />
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
            {t('auth.updatePasswordCta')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
