'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils/cn';

export function LanguageSwitcher({
  className,
  tone = 'default',
}: {
  className?: string;
  tone?: 'default' | 'onDark';
}) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next as (typeof routing.locales)[number] });
  }

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      {routing.locales.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLocale(code)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold tracking-wide transition-all duration-200',
              active
                ? tone === 'onDark'
                  ? 'border-primary/40 bg-primary/10 text-primary shadow-glow-sm'
                  : 'border-primary/40 bg-primary/10 text-primary'
                : tone === 'onDark'
                  ? 'border-white/[0.06] bg-transparent text-white/40 hover:border-white/[0.12] hover:text-white/80'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-[5px] w-[5px] shrink-0 rounded-full bg-primary transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-40'
              )}
            />
            {code === 'ar' ? 'AR' : 'EN'}
          </button>
        );
      })}
    </div>
  );
}
