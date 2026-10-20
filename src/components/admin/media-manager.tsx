'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Upload, Loader2, Trash2, Copy, RefreshCw, ImageIcon } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import type { AdminMediaFile } from '@/lib/data/admin';

export function MediaManager({ initialFiles }: { initialFiles: AdminMediaFile[] }) {
  const t = useTranslations('admin.media');
  const router = useRouter();
  const [files, setFiles] = React.useState<AdminMediaFile[]>(initialFiles);
  const [busy, setBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminMediaFile | null>(null);

  async function refresh() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/media');
      if (!res.ok) {
        toast.error(t('loadFailed'));
        return;
      }
      const data = await res.json();
      setFiles(data.files ?? []);
      router.refresh();
    } catch {
      toast.error(t('loadFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let uploaded = 0;
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (res.ok) uploaded += 1;
      }
      if (uploaded > 0) toast.success(t('uploaded', { count: uploaded }));
      await refresh();
    } catch {
      toast.error(t('uploadFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: deleteTarget.path }),
    });
    if (!res.ok) {
      toast.error(t('deleteFailed'));
      return;
    }
    toast.success(t('deleted'));
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleUpload(e.target.files);
              e.target.value = '';
            }}
            disabled={busy}
          />
          <Button asChild>
            <span>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
              {t('upload')}
            </span>
          </Button>
        </label>
        <Button variant="outline" onClick={() => void refresh()} disabled={busy}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t('refresh')}
        </Button>
        <span className="text-sm text-muted-foreground">{t('count', { count: files.length })}</span>
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={t('empty')}
          description={t('emptyDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {files.map((file) => (
            <Card key={file.path} className="overflow-hidden">
              <div className="relative aspect-video bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <CardContent className="p-3">
                <p className="truncate text-xs text-muted-foreground" dir="ltr" title={file.name}>
                  {file.name}
                </p>
                {file.size != null && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await navigator.clipboard.writeText(file.url);
                      toast.success(t('copied'));
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('copyUrl')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(file)} aria-label={t('delete')}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteTitle')}
        description={t('deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  );
}
