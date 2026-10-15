import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/account/profile-form';
import { PasswordForm } from '@/components/account/password-form';
import { formatDate } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function AccountPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('account');
  const ta = await getTranslations('auth');

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('profileSection')}</CardTitle>
            <CardDescription>{t('profileDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                fullName: user.profile?.full_name ?? '',
                phone: user.profile?.phone ?? '',
                businessName: user.profile?.business_name ?? '',
                preferredLocale: (user.profile?.preferred_locale as 'ar' | 'en') ?? locale,
              }}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('signInInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{ta('email')}</span>
                <span dir="ltr" className="font-medium">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('memberSince')}</span>
                <span className="font-medium">
                  {user.profile?.created_at ? formatDate(user.profile.created_at, locale) : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{ta('businessName')}</span>
                <span className="font-medium">{user.profile?.business_name ?? '—'}</span>
              </div>
              <Button variant="outline" size="sm" asChild className="mt-2 w-full">
                <Link href="/orders">{t('ordersShortcut')}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('passwordSection')}</CardTitle>
              <CardDescription>{t('passwordDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
