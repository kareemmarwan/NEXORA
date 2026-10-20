'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminSchemas } from '@/lib/validation';

type FormValues = {
  fullName: string;
  phone: string;
  businessName: string;
  role: 'customer' | 'admin';
};

export function CustomerEditForm({
  customerId,
  isSelf,
  defaultValues,
}: {
  customerId: string;
  isSelf: boolean;
  defaultValues: FormValues;
}) {
  const t = useTranslations('admin.customers.form');
  const te = useTranslations('errors');
  const router = useRouter();

  const schemas = React.useMemo(() => createAdminSchemas((key) => key), []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schemas.customerUpdateSchema),
    defaultValues,
  });

  async function onSubmit(values: FormValues) {
    const payload: Record<string, string> = {
      fullName: values.fullName,
      phone: values.phone ?? '',
      businessName: values.businessName ?? '',
    };
    if (!isSelf) payload.role = values.role;

    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        cannot_change_own_role: t('selfRoleError'),
        last_admin: t('lastAdminError'),
        invalid_input: te('validation'),
      };
      toast.error(messages[data.error] ?? te('generic'));
      return;
    }

    toast.success(t('saved'));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input id="fullName" {...form.register('fullName')} />
            </div>
            <div>
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input id="phone" dir="ltr" {...form.register('phone')} />
            </div>
            <div>
              <Label htmlFor="businessName">{t('businessName')}</Label>
              <Input id="businessName" {...form.register('businessName')} />
            </div>
            <div>
              <Label htmlFor="role">{t('role')}</Label>
              {isSelf ? (
                <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {t('selfRoleHint')}
                </div>
              ) : (
                <Select id="role" {...form.register('role')}>
                  <option value="customer">{t('roleCustomer')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                </Select>
              )}
            </div>
          </div>
          <div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {t('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
