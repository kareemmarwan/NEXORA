'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProofStatusBadge } from '@/components/orders/status-badges';
import type { PaymentProof } from '@/types/database';

export function ProofUploadPanel({
  orderId,
  proofs,
  canUpload,
}: {
  orderId: string;
  proofs: PaymentProof[];
  canUpload: boolean;
}) {
  const t = useTranslations('orders');
  const te = useTranslations('errors');
  const [file, setFile] = React.useState<File | null>(null);
  const [note, setNote] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const latestProof = proofs.length > 0 ? proofs[proofs.length - 1]! : null;

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowed.includes(selected.type)) {
      toast.error(te('uploadInvalidType'));
      event.target.value = '';
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error(te('uploadTooLarge'));
      event.target.value = '';
      return;
    }
    setFile(selected);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('note', note);

      const res = await fetch(`/api/orders/${orderId}/proof`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error === 'rate_limited' ? te('rateLimited') : te('generic'));
        return;
      }

      toast.success(t('proofUploaded'));
      setFile(null);
      setNote('');
      if (inputRef.current) inputRef.current.value = '';
      window.location.reload();
    } catch {
      toast.error(te('generic'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {latestProof && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <a
              href={`/api/orders/${orderId}/proof/${latestProof.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('downloadProof')}
            </a>
          </div>
          <ProofStatusBadge status={latestProof.status} />
        </div>
      )}

      {latestProof?.status === 'rejected' && (
        <p className="text-sm text-destructive">{t('proofRejectedHint')}</p>
      )}

      {canUpload && (
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="proof-file">{t('uploadProof')}</Label>
            <input
              ref={inputRef}
              id="proof-file"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={onFileChange}
              className="block w-full cursor-pointer rounded-xl border border-input bg-card p-2 text-sm file:me-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('uploadProofHint')}</p>
          </div>

          <div>
            <Label htmlFor="proof-note">{t('proofNote')}</Label>
            <Textarea
              id="proof-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('proofNotePlaceholder')}
              rows={2}
            />
          </div>

          <Button onClick={upload} disabled={!file || uploading} className="w-fit">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {t('submitProof')}
          </Button>
        </div>
      )}
    </div>
  );
}
