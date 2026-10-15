'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const t = useTranslations('common');
  const locale = useLocale();

  if (pageCount <= 1) return null;

  const pages: number[] = [];
  const windowSize = 2;
  for (let i = Math.max(1, page - windowSize); i <= Math.min(pageCount, page + windowSize); i++) {
    pages.push(i);
  }

  const chevronClass = 'h-5 w-5 rtl:-scale-x-100';

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="tap-target rounded-xl border border-border px-3 text-muted-foreground disabled:opacity-40 hover:bg-muted"
        aria-label={t('previous')}
      >
        <ChevronLeft className={chevronClass} aria-hidden="true" />
      </button>

      {pages[0]! > 1 && (
        <>
          <PageButton n={1} current={page} onPageChange={onPageChange} />
          {pages[0]! > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}

      {pages.map((n) => (
        <PageButton key={n} n={n} current={page} onPageChange={onPageChange} />
      ))}

      {pages[pages.length - 1]! < pageCount && (
        <>
          {pages[pages.length - 1]! < pageCount - 1 && (
            <span className="px-1 text-muted-foreground">…</span>
          )}
          <PageButton n={pageCount} current={page} onPageChange={onPageChange} />
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        className="tap-target rounded-xl border border-border px-3 text-muted-foreground disabled:opacity-40 hover:bg-muted"
        aria-label={t('next')}
      >
        <ChevronRight className={chevronClass} aria-hidden="true" />
      </button>
      <span className="sr-only">
        {t('page')} {page} {t('of')} {pageCount} — {locale}
      </span>
    </nav>
  );
}

function PageButton({
  n,
  current,
  onPageChange,
}: {
  n: number;
  current: number;
  onPageChange: (page: number) => void;
}) {
  const active = n === current;
  return (
    <button
      type="button"
      onClick={() => onPageChange(n)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'tap-target min-w-[44px] rounded-xl border px-3 text-sm font-medium',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-foreground hover:bg-muted'
      )}
    >
      {n}
    </button>
  );
}
