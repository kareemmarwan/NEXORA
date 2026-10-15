import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireUser } from '@/lib/auth/session';
import { getActivePaymentMethods } from '@/lib/data/services';
import { isStripeEnabled } from '@/lib/stripe';
import { CheckoutFlow } from '@/components/cart/checkout-flow';
import type { SupportedLocale } from '@/lib/utils/format';

export default async function CheckoutPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale === 'en' ? 'en' : 'ar') as SupportedLocale;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations('checkout');

  const paymentMethods = await getActivePaymentMethods();
  const stripeEnabled = isStripeEnabled();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <CheckoutFlow paymentMethods={paymentMethods} stripeEnabled={stripeEnabled} />
    </div>
  );
}
