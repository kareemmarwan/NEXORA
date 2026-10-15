'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ProofStatusBadge } from '@/components/orders/status-badges';
import type { PaymentProof } from '@/types/database';

export function ProofReview({
  orderId,
  proofs,
  signedUrls,
}: {
  orderId: string;
  proofs: PaymentProof[];
  signedUrls: (string | null)[];
}) {
  const t = useTranslations('admin');
  const te = useTranslations('errors');
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function review(proofId: string, action: 'approve' | 'reject') {
    const confirmMessage = action === 'approve' ? t('approveConfirm') : t('rejectConfirm');
    if (!window.confirm(confirmMessage)) return;

    setBusy(proofId + action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'review_proof', proofId, proofAction: action }),
      });
      if (!res.ok) {
        toast.error(te('generic'));
        return;
      }
      toast.success(t('proofReviewed'));
      router.refresh();
    } catch {
      toast.error(te('generic'));
    } finally {
      setBusy(null);
    }
  }

  if (proofs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('noOrders')}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {proofs.map((proof, index) => {
        const url = signedUrls[index];
        return (
          <div key={proof.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t('paymentProofs')} #{index + 1}
                  </a>
                )}
                <ProofStatusBadge status={proof.status} />
              </div>

              {proof.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    loading={busy === proof.id + 'approve'}
                    onClick={() => review(proof.id, 'approve')}
                  >
                    {busy !== proof.id + 'approve' && (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    loading={busy === proof.id + 'reject'}
                    onClick={() => review(proof.id, 'reject')}
                  >
                    {busy !== proof.id + 'reject' && <XCircle className="h-4 w-4" aria-hidden="true" />}
                    {t('reject')}
                  </Button>
                </div>
              )}
            </div>
            {proof.note && <p className="mt-2 text-sm text-muted-foreground">{proof.note}</p>}
            {url && (
              <iframe
                src={url}
                title={`Proof ${index + 1}`}
                className="mt-3 h-64 w-full rounded-lg border border-border"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
