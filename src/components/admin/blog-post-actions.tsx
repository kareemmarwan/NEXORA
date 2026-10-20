'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export function BlogPostDeleteButton({ postId, title }: { postId: string; title: string }) {
  const t = useTranslations('admin.blogForm');
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  async function handleDelete() {
    const res = await fetch('/api/admin/blog', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId }),
    });
    if (!res.ok) {
      toast.error(t('deleteFailed'));
      return;
    }
    toast.success(t('deleted'));
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={t('delete')}>
        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        description={t('deleteConfirm', { title })}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </>
  );
}
