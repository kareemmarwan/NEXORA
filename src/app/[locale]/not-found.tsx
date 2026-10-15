'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="container py-20">
      <EmptyState
        icon={FileQuestion}
        title={t('notFoundTitle')}
        description={t('notFoundDesc')}
        action={
          <Button asChild>
            <Link href="/">{t('goHome')}</Link>
          </Button>
        }
      />
    </div>
  );
}
