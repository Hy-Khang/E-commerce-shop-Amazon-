const BACKEND_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_API_BASE_URL || '').origin;
  } catch {
    return '';
  }
})();

export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${url}` : url;
}

import i18n from '@/common/i18n/config';

/** Map the active UI language to an Intl locale tag (grouping/date format). */
function localeTag(): string {
  return (i18n.language || 'en').startsWith('vi') ? 'vi-VN' : 'en-US';
}

/** Prices are always VND; only the number formatting follows the UI language. */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat(localeTag(), {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat(localeTag(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
