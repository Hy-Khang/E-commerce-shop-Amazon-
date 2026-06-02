import { useI18nStore } from './i18n.store';
import { locales, interpolate } from './i18n';
import type { TranslationSchema } from './i18n.types';

export function useTranslation() {
  const { locale, setLocale } = useI18nStore();
  const messages = locales[locale];

  function t(
    selector: (m: TranslationSchema) => string,
    params?: Record<string, string | number>,
  ): string {
    return interpolate(selector(messages), params);
  }

  return { t, locale, setLocale };
}
