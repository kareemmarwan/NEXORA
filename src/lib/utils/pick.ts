import type { SupportedLocale } from '@/lib/utils/format';

/**
 * Pick a localized field from a bilingual database row.
 * Falls back to the other language when the preferred one is empty.
 */
export function pick<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: SupportedLocale
): string {
  const preferred = row[`${field}_${locale}`];
  const fallback = row[`${field}_${locale === 'ar' ? 'en' : 'ar'}`];
  if (typeof preferred === 'string' && preferred.trim().length > 0) return preferred;
  if (typeof fallback === 'string' && fallback.trim().length > 0) return fallback;
  return '';
}

export function pickJson<T>(row: Record<string, unknown>, field: string, locale: SupportedLocale): T {
  const preferred = row[`${field}_${locale}`];
  const fallback = row[`${field}_${locale === 'ar' ? 'en' : 'ar'}`];
  return (preferred ?? fallback ?? []) as T;
}
