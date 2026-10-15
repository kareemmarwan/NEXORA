'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { XCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';

export function OrderActions({
  orderId,
  canCancel,
  canComplete,
  canPayOnline,
}: {
  orderId: string;
  canCancel: boolean;
  canComplete: boolean;
  canPayOnline: boolean;
}) {
  const t = useTranslations('orders');
  const te = useTranslations('errors');
  const router = useRouter();
  const [busy, setBusy] = React.useState<'cancel' | 'complete' | 'pay' | null>(null);

  async function cancelOrder() {
    if (!window.confirm(t('cancelConfirm'))) return;
    setBusy('cancel');
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error === 'not_allowed' ? t('cancelNotAllowed') : te('generic'));
        return;
      }
      toast.success(t('orderCancelled'));
      router.refresh();
    } catch {
      toast.error(te('generic'));
    } finally {
      setBusy(null);
    }
  }

  async function completeOrder() {
    setBusy('complete');
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, { method: 'POST' });
      if (!res.ok) {
        toast.error(te('generic'));
        return;
      }
      toast.success(t('orderCompleted'));
      router.refresh();
    } catch {
      toast.error(te('generic'));
    } finally {
      setBusy(null);
    }
  }

  async function payOnline() {
    setBusy('pay');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(te('stripeNotConfigured'));
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error(te('generic'));
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canPayOnline && (
        <Button onClick={payOnline} loading={busy === 'pay'} size="lg">
          {busy !== 'pay' && <CreditCard className="h-4 w-4" aria-hidden="true" />}
          {t('payNow')}
        </Button>
      )}
      {canComplete && (
        <Button variant="success" onClick={completeOrder} loading={busy === 'complete'}>
          {busy !== 'complete' && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          {t('markComplete')}
        </Button>
      )}
      {canCancel && (
        <Button variant="destructive" onClick={cancelOrder} loading={busy === 'cancel'}>
          {busy !== 'cancel' && <XCircle className="h-4 w-4" aria-hidden="true" />}
          {t('cancelOrder')}
        </Button>
      )}
    </div>
  );
}
