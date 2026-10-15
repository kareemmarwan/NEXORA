'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { OrderStatus } from '@/types/database';

const FLOW: OrderStatus[] = [
  'pending_payment',
  'payment_review',
  'paid',
  'in_progress',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
];

export function OrderStatusForm({
  orderId,
  currentStatus,
  deliveryNotes,
  internalNotes,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  deliveryNotes: string;
  internalNotes: string;
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatus>(currentStatus);
  const [message, setMessage] = React.useState('');
  const [delivery, setDelivery] = React.useState(deliveryNotes);
  const [internal, setInternal] = React.useState(internalNotes);
  const [busy, setBusy] = React.useState<'status' | 'delivery' | 'internal' | null>(null);

  async function updateStatus() {
    setBusy('status');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status, message }),
      });
      if (!res.ok) {
        toast.error('errors.generic');
        return;
      }
      toast.success(t('statusUpdated'));
      setMessage('');
      router.refresh();
    } catch {
      toast.error('errors.generic');
    } finally {
      setBusy(null);
    }
  }

  async function saveDeliveryNotes() {
    setBusy('delivery');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delivery_notes', deliveryNotes: delivery }),
      });
      if (!res.ok) {
        toast.error('errors.generic');
        return;
      }
      toast.success(t('deliverySaved'));
      router.refresh();
    } catch {
      toast.error('errors.generic');
    } finally {
      setBusy(null);
    }
  }

  async function saveInternalNotes() {
    setBusy('internal');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'internal_notes', internalNotes: internal }),
      });
      if (!res.ok) {
        toast.error('errors.generic');
        return;
      }
      toast.success(t('statusUpdated'));
      router.refresh();
    } catch {
      toast.error('errors.generic');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border p-5">
        <h2 className="mb-4 font-semibold">{t('changeStatus')}</h2>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="status-select">{t('changeStatus')}</Label>
            <Select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {FLOW.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status-message">{t('statusMessage')}</Label>
            <Textarea
              id="status-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('statusMessagePlaceholder')}
              rows={2}
            />
          </div>
          <Button onClick={updateStatus} loading={busy === 'status'} className="w-fit">
            {busy !== 'status' && <Check className="h-4 w-4" aria-hidden="true" />}
            {t('updateStatus')}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h2 className="mb-4 font-semibold">{t('deliveryNotesLabel')}</h2>
        <Textarea
          value={delivery}
          onChange={(e) => setDelivery(e.target.value)}
          placeholder={t('deliveryNotesPlaceholder')}
          rows={4}
          aria-label={t('deliveryNotesLabel')}
        />
        <Button onClick={saveDeliveryNotes} loading={busy === 'delivery'} className="mt-3 w-fit">
          {busy === 'delivery' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {t('saveDeliveryNotes')}
        </Button>
      </div>

      <div className="rounded-2xl border border-border p-5">
        <h2 className="mb-4 font-semibold">{t('internalNotes')}</h2>
        <Textarea
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          placeholder={t('internalNotesPlaceholder')}
          rows={3}
          aria-label={t('internalNotes')}
        />
        <Button onClick={saveInternalNotes} loading={busy === 'internal'} variant="outline" className="mt-3 w-fit">
          {busy === 'internal' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {t('saveDeliveryNotes')}
        </Button>
      </div>
    </div>
  );
}
