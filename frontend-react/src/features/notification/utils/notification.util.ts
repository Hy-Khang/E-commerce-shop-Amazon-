import type { TFunction } from 'i18next';

export function formatRelativeTime(
  dateString: string,
  t: TFunction<'notification'>,
): string {
  const utcString =
    dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)
      ? dateString
      : dateString + 'Z';
  const now = Date.now();
  const date = new Date(utcString).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return t('time.justNow');
  if (diffMin < 60) return t('time.minutesAgo', { count: diffMin });
  if (diffHour < 24) return t('time.hoursAgo', { count: diffHour });
  if (diffDay < 7) return t('time.daysAgo', { count: diffDay });

  return new Date(utcString).toLocaleDateString();
}
