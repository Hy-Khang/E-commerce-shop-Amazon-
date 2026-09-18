import { useTranslation } from 'react-i18next';
import { formatPrice, formatDate } from '@/common/utils/format.util';

/**
 * Reactive formatting helpers. `useTranslation()` subscribes the component to
 * language changes, so a component that shows prices/dates but no other `t()`
 * text still re-renders (and re-formats) when the language switches.
 */
export function useFormat() {
  useTranslation();
  return { formatPrice, formatDate };
}
