'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <div className="container flex flex-col items-center gap-5 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold">{t('generic')}</h1>
      {error.digest && <p className="text-sm text-muted-foreground">Digest: {error.digest}</p>}
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </div>
  );
}
