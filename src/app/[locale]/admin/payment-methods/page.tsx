import { setRequestLocale } from 'next-intl/server';
import { PaymentMethodManager } from '@/components/admin/payment-method-manager';
import { getAdminPaymentMethods } from '@/lib/data/admin';

export default async function AdminPaymentMethodsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const methods = await getAdminPaymentMethods();

  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodManager methods={methods} />
    </div>
  );
}
