import { vi } from './locales/vi';
import { en } from './locales/en';
import { useI18nStore } from './i18n.store';
import type { Locale, TranslationSchema } from './i18n.types';

const locales: Record<Locale, TranslationSchema> = { vi, en };

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    params[key] !== undefined ? String(params[key]) : match,
  );
}

export function translate(
  selector: (m: TranslationSchema) => string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  const resolved = locale ?? useI18nStore.getState().locale;
  return interpolate(selector(locales[resolved]), params);
}

export function getMessages(locale?: Locale): TranslationSchema {
  const resolved = locale ?? useI18nStore.getState().locale;
  return locales[resolved];
}

export { locales };
