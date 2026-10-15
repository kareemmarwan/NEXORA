'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Globe } from 'lucide-react';
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
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border p-1',
        tone === 'onDark' ? 'border-white/20' : 'border-border',
        className
      )}
    >
      <Globe
        className={cn('ms-1 h-4 w-4', tone === 'onDark' ? 'text-white/70' : 'text-muted-foreground')}
        aria-hidden="true"
      />
      <div role="group" aria-label={t('language')} className="flex">
        {routing.locales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => switchLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              'h-8 rounded-lg px-2.5 text-xs font-semibold transition-colors',
              locale === code
                ? tone === 'onDark'
                  ? 'bg-white text-navy'
                  : 'bg-primary text-primary-foreground'
                : tone === 'onDark'
                  ? 'text-white/70 hover:bg-white/10 hover:text-white'
                  : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {code === 'ar' ? 'العربية' : 'EN'}
          </button>
        ))}
      </div>
    </div>
  );
}
