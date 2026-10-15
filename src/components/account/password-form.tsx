'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { createAuthSchemas, type ChangePasswordInput } from '@/lib/validation';

export function PasswordForm() {
  const t = useTranslations();
  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(schemas.changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  async function onSubmit(values: ChangePasswordInput) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: values.currentPassword,
    });

    if (signInError) {
      form.setError('currentPassword', { message: t('validation.currentPasswordRequired') });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.newPassword });
    if (error) {
      toast.error(t('errors.generic'));
      return;
    }
    toast.success(t('account.passwordChanged'));
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="currentPassword" required>
          {t('account.currentPassword')}
        </Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          invalid={!!form.formState.errors.currentPassword}
          {...form.register('currentPassword')}
        />
        {form.formState.errors.currentPassword && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.currentPassword.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword" required>
          {t('account.newPassword')}
        </Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          invalid={!!form.formState.errors.newPassword}
          {...form.register('newPassword')}
        />
        {form.formState.errors.newPassword && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.newPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={form.formState.isSubmitting} className="w-fit">
        {t('account.updatePassword')}
      </Button>
    </form>
  );
}
