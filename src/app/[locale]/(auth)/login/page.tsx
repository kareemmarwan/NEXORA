'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { createAuthSchemas, type LoginInput } from '@/lib/validation';

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const schemas = React.useMemo(() => createAuthSchemas((key) => t(key)), [t]);
  const form = useForm<LoginInput>({
    resolver: zodResolver(schemas.loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const nextPath = searchParams.get('next') ?? null;

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    toast.success(t('auth.welcomeBack', { name: values.email }));
    router.push((nextPath as '/' | undefined) ?? '/');
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    const redirectTo = nextPath ? `${origin}${nextPath}` : `${origin}/`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.loginTitle')}</CardTitle>
        <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {serverError && (
          <div className="mb-4">
            <Alert variant="error">{serverError}</Alert>
          </div>
        )}

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
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password" required>
              {t('auth.password')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                {...form.register('rememberMe')}
              />
              {t('auth.rememberMe')}
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" loading={form.formState.isSubmitting} className="w-full">
            {t('auth.loginCta')}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t('auth.orDivider')}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle} type="button">
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.17v2.98h5.27c-.23 1.38-1.65 4.05-5.27 4.05-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.79 3.9 14.68 3 12.18 3 7.03 3 2.86 7.17 2.86 12.28s4.17 9.28 9.32 9.28c5.38 0 8.95-3.78 8.95-9.1 0-.61-.07-1.07-.18-1.36Z"
            />
          </svg>
          {t('auth.googleCta')}
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {t('auth.registerCta')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
