'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ClipboardList,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Landmark,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCartStore } from '@/store/cart';
import { computeOrderPricing } from '@/lib/pricing';
import { formatPrice } from '@/lib/utils/format';
import type { SupportedLocale } from '@/lib/utils/format';
import type { PaymentMethod } from '@/types/database';

type Step = 1 | 2 | 3;

interface PreviewService {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  price: number;
  currency: string;
  delivery_days: number;
  requirements_ar: string[];
  requirements_en: string[];
}

interface BriefFormValues {
  contactPhone: string;
  customerNotes: string;
  services: {
    serviceId: string;
    answers: { value: string }[];
    notes: string;
  }[];
}

export function CheckoutFlow({
  paymentMethods,
  stripeEnabled,
}: {
  paymentMethods: PaymentMethod[];
  stripeEnabled: boolean;
}) {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [step, setStep] = React.useState<Step>(1);
  const [preview, setPreview] = React.useState<{
    services: PreviewService[];
    pricing: { subtotal: number; total: number; maxDeliveryDays: number; currency: string };
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(true);
  const [paymentMethodType, setPaymentMethodType] = React.useState<'manual' | 'stripe'>('manual');
  const [selectedMethodId, setSelectedMethodId] = React.useState<string | null>(
    paymentMethods[0]?.id ?? null
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<BriefFormValues>({
    defaultValues: {
      contactPhone: '',
      customerNotes: '',
      services: [],
    },
  });

  const { fields: serviceFields } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  // Fetch server-side pricing + requirements for the cart.
  React.useEffect(() => {
    if (items.length === 0) {
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoadingPreview(true);
      try {
        const res = await fetch('/api/checkout/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              serviceId: item.serviceId,
              quantity: item.quantity,
              addonIds: item.addons.map((a) => a.id),
            })),
          }),
        });
        if (!res.ok) throw new Error('preview_failed');
        const data = await res.json();
        if (cancelled) return;
        setPreview(data);
        form.reset({
          contactPhone: '',
          customerNotes: '',
          services: data.services.map((service: PreviewService) => {
            const reqs =
              locale === 'ar' ? service.requirements_ar : service.requirements_en;
            return {
              serviceId: service.id,
              answers: reqs.map(() => ({ value: '' })),
              notes: '',
            };
          }),
        });
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const pricingItems = preview
    ? items.map((item) => ({
        serviceId: item.serviceId,
        unitPrice: item.price,
        deliveryDays: item.deliveryDays,
        quantity: item.quantity,
        addons: item.addons.map((a) => ({ id: a.id, price: a.price, extra_days: a.extra_days })),
      }))
    : [];
  const displayPricing = computeOrderPricing(pricingItems);

  const steps = [
    { n: 1 as const, label: t('step1'), icon: ClipboardList },
    { n: 2 as const, label: t('step2'), icon: CreditCard },
    { n: 3 as const, label: t('step3'), icon: CheckCircle2 },
  ];

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  function validateBrief(): boolean {
    const values = form.getValues();
    if (!values.contactPhone || values.contactPhone.trim().length < 6) {
      toast.error(t('phoneRequired'));
      return false;
    }
    for (const service of values.services) {
      if (service.answers.some((a) => !a.value || a.value.trim().length === 0)) {
        toast.error(t('fillAllRequirements'));
        return false;
      }
    }
    return true;
  }

  async function confirmOrder() {
    setSubmitting(true);
    setServerError(null);
    try {
      const values = form.getValues();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            serviceId: item.serviceId,
            quantity: item.quantity,
            addonIds: item.addons.map((a) => a.id),
          })),
          brief: Object.fromEntries(
            values.services.map((service) => [
              service.serviceId,
              {
                answers: service.answers.map((a) => a.value.trim()),
                notes: service.notes?.trim() || undefined,
              },
            ])
          ),
          paymentMethodType,
          paymentMethodId: paymentMethodType === 'manual' ? selectedMethodId : null,
          customerNotes: values.customerNotes?.trim() || undefined,
          contactPhone: values.contactPhone.trim(),
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMessages: Record<string, string> = {
          rate_limited: te('rateLimited'),
          unauthorized: te('unauthorized'),
          invalid_input: te('validation'),
          service_not_found: te('orderNotFound'),
          brief_incomplete: t('fillAllRequirements'),
          payment_method_not_found: t('paymentMethodRequired'),
          stripe_not_configured: te('stripeNotConfigured'),
          stripe_session_failed: te('generic'),
          order_create_failed: te('generic'),
        };
        toast.error(errorMessages[data.error] ?? te('generic'));
        setServerError(null);
        setSubmitting(false);
        return;
      }

      clearCart();
      if (data.redirectUrl) {
        toast.success(t('redirectingToPayment'));
        window.location.href = data.redirectUrl;
        return;
      }
      toast.success(t('orderCreated'));
      router.push(`/orders/${data.orderId}`);
    } catch {
      toast.error(te('generic'));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">{t('backToCart')}</p>
        <Button className="mt-4" onClick={() => router.push('/services')}>
          {tc('continueShopping')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map(({ n, label, icon: Icon }) => {
          const active = step === n;
          const done = step > n;
          return (
            <li key={n} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (n < step) setStep(n);
                  if (n === 2 && step === 1 && validateBrief()) setStep(2);
                  if (n === 3 && step === 2) setStep(3);
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : done
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-border text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
              {n < 3 && <span className="h-px w-6 bg-border" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Brief */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('step1Title')}</CardTitle>
                <CardDescription>{t('step1Desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPreview ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    {tc('loading')}
                  </div>
                ) : (
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (validateBrief()) setStep(2);
                    }}
                  >
                    <div>
                      <Label htmlFor="contactPhone" required>
                        {t('contactPhone')}
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        dir="ltr"
                        placeholder={t('contactPhonePlaceholder')}
                        {...form.register('contactPhone')}
                      />
                    </div>

                    {serviceFields.map((field, index) => {
                      const service = preview?.services[index];
                      if (!service) return null;
                      const requirements =
                        locale === 'ar' ? service.requirements_ar : service.requirements_en;
                      const title = locale === 'ar' ? service.title_ar : service.title_en;

                      return (
                        <fieldset key={field.id} className="rounded-2xl border border-border p-5">
                          <legend className="px-2 text-sm font-semibold text-primary">
                            {t('briefFor', { title })}
                          </legend>
                          <div className="flex flex-col gap-4">
                            {requirements.map((requirement, reqIndex) => (
                              <div key={`${field.id}-req-${reqIndex}`}>
                                <Label htmlFor={`${field.id}-req-${reqIndex}`} required>
                                  {requirement}
                                </Label>
                                <Textarea
                                  id={`${field.id}-req-${reqIndex}`}
                                  placeholder={t('requirementPlaceholder')}
                                  {...form.register(`services.${index}.answers.${reqIndex}.value`)}
                                />
                              </div>
                            ))}
                            <div>
                              <Label htmlFor={`${field.id}-notes`}>{t('notesLabel')}</Label>
                              <Textarea
                                id={`${field.id}-notes`}
                                placeholder={t('notesPlaceholder')}
                                {...form.register(`services.${index}.notes`)}
                              />
                            </div>
                          </div>
                        </fieldset>
                      );
                    })}

                    <div>
                      <Label htmlFor="customerNotes">{t('generalNotes')}</Label>
                      <Textarea
                        id="customerNotes"
                        placeholder={t('notesPlaceholder')}
                        {...form.register('customerNotes')}
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full sm:w-fit">
                      {t('continueToPayment')}
                      <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('paymentTitle')}</CardTitle>
                <CardDescription>{t('paymentDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('manual')}
                    className={`flex flex-col items-start gap-2 rounded-2xl border p-5 text-start transition-colors ${
                      paymentMethodType === 'manual'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="font-semibold">{t('manualPayment')}</span>
                    <span className="text-xs text-muted-foreground">{t('manualPaymentDesc')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethodType('stripe')}
                    disabled={!stripeEnabled}
                    className={`flex flex-col items-start gap-2 rounded-2xl border p-5 text-start transition-colors ${
                      paymentMethodType === 'stripe'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    } disabled:opacity-50`}
                  >
                    <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="font-semibold">{t('onlinePayment')}</span>
                    <span className="text-xs text-muted-foreground">{t('onlinePaymentDesc')}</span>
                  </button>
                </div>

                {paymentMethodType === 'manual' && (
                  <fieldset className="flex flex-col gap-3">
                    <legend className="mb-2 text-sm font-medium">{t('selectPaymentMethod')}</legend>
                    {paymentMethods.length === 0 && (
                      <Alert variant="warning">{t('noPaymentMethods')}</Alert>
                    )}
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors ${
                          selectedMethodId === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.id}
                            checked={selectedMethodId === method.id}
                            onChange={() => setSelectedMethodId(method.id)}
                            className="h-4 w-4 accent-[hsl(var(--primary))]"
                          />
                          <span className="font-medium">
                            {locale === 'ar' ? method.label_ar : method.label_en}
                          </span>
                        </div>
                        {(method.details_ar || method.details_en) && (
                          <p className="whitespace-pre-line rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                            {locale === 'ar' ? method.details_ar : method.details_en}
                          </p>
                        )}
                      </label>
                    ))}
                  </fieldset>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    {tc('back')}
                  </Button>
                  <Button
                    onClick={() => {
                      if (paymentMethodType === 'manual' && !selectedMethodId) {
                        toast.error(t('paymentMethodRequired'));
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    {t('continueToReview')}
                    <Arrow className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reviewTitle')}</CardTitle>
                <CardDescription>{t('reviewDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <section className="rounded-2xl border border-border p-4">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                    {t('step1')}
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                      {t('editBrief')}
                    </Button>
                  </h3>
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('contactPhone')}</dt>
                      <dd dir="ltr">{form.getValues('contactPhone')}</dd>
                    </div>
                    {form.getValues('services')?.map((service, index) => {
                      const info = preview?.services[index];
                      if (!info) return null;
                      return (
                        <div key={service.serviceId} className="flex flex-col gap-1">
                          <dt className="font-medium text-foreground">
                            {locale === 'ar' ? info.title_ar : info.title_en}
                          </dt>
                          <dd className="text-xs text-muted-foreground">
                            {service.answers.map((a) => a.value).filter(Boolean).join(' · ')}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </section>

                <section className="rounded-2xl border border-border p-4">
                  <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                    {t('step2')}
                    <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                      {t('editPayment')}
                    </Button>
                  </h3>
                  <p className="text-sm">
                    {paymentMethodType === 'manual'
                      ? t('manualPayment')
                      : t('onlinePayment')}
                  </p>
                </section>

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    {tc('back')}
                  </Button>
                  <Button
                    size="lg"
                    loading={submitting}
                    onClick={confirmOrder}
                    disabled={paymentMethodType === 'manual' && paymentMethods.length === 0}
                  >
                    {!submitting && <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    {submitting ? t('placingOrder') : t('confirmOrder')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary sidebar */}
        <aside>
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">{tc('checkout')}</h2>
            <ul className="flex flex-col gap-3">
              {items.map((item, index) => {
                const line = displayPricing.items[index];
                return (
                  <li key={item.serviceId} className="flex flex-col gap-1 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">
                        {locale === 'ar' ? item.titleAr : item.titleEn}
                      </span>
                      <span className="font-semibold">
                        {line ? formatPrice(line.lineTotal, locale, item.currency) : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="muted">×{item.quantity}</Badge>
                      <Badge variant="muted">
                        {tc('deliveryDays', { count: line?.deliveryDays ?? item.deliveryDays })}
                      </Badge>
                      {item.addons.map((addon) => (
                        <Badge key={addon.id} variant="outline">
                          {locale === 'ar' ? addon.title_ar : addon.title_en}
                        </Badge>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold">{tc('total')}</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(displayPricing.total, locale, displayPricing.currency)}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {tc('deliveryDays', { count: displayPricing.maxDeliveryDays })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
