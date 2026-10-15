export type SupportedLocale = 'ar' | 'en';

const numberFormatterCache = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(locale: SupportedLocale): Intl.NumberFormat {
  let formatter = numberFormatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === 'ar' ? 'en-US' : 'en-US', {
      maximumFractionDigits: 2,
    });
    numberFormatterCache.set(locale, formatter);
  }
  return formatter;
}

/**
 * Format a number using Western digits (0-9) in both locales so prices
 * are unambiguous for Arabic and English readers alike.
 */
export function formatNumber(value: number, locale: SupportedLocale): string {
  return getNumberFormatter(locale).format(value);
}

export function formatPrice(value: number, locale: SupportedLocale, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : currency;
  return `${symbol}${formatNumber(value, locale)}`;
}

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatDate(value: string | Date, locale: SupportedLocale): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const key = `${locale}-date`;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'en-GB' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    dateFormatterCache.set(key, formatter);
  }
  return formatter.format(date);
}

export function formatDateTime(value: string | Date, locale: SupportedLocale): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const key = `${locale}-datetime`;
  let formatter = dateFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'en-GB' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    dateFormatterCache.set(key, formatter);
  }
  return formatter.format(date);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
