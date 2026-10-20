'use client';

import * as React from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

export interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  label,
  aspect = 'aspect-video',
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error === 'file_too_large' ? 'الملف كبير جداً (الحد 4MB)' : 'فشل رفع الصورة');
        return;
      }
      onChange(data.url as string);
      toast.success('تم رفع الصورة');
    } catch {
      toast.error('فشل رفع الصورة');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>}
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 transition-colors',
          aspect
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file && !busy && !disabled) void handleFile(file);
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
              aria-label="إزالة الصورة"
              className="absolute end-2 top-2 rounded-lg bg-navy/70 p-2 text-white backdrop-blur transition-colors hover:bg-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-6 w-6" aria-hidden="true" />
            )}
            <span className="text-xs font-medium">اسحب صورة هنا أو اضغط للاختيار</span>
            <span className="text-[11px] text-muted-foreground/60">PNG, JPG, WebP — حتى 4MB</span>
          </button>
        )}
      </div>
      {value && (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="mt-2 text-xs font-medium text-primary hover:underline"
        >
          تغيير الصورة
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
