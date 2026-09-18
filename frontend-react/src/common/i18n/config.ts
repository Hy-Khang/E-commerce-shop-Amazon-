import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { z } from 'zod';
import { resources, defaultNS, ns } from './resources';
import { createZodErrorMap } from './zodErrorMap';

// One-time cleanup of the abandoned Zustand scaffold key (stored JSON, which the
// i18next detector can't read). Harmless if absent.
try {
  localStorage.removeItem('i18n-locale');
} catch {
  /* ignore (private mode / no storage) */
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    ns,
    defaultNS,
    fallbackLng: 'en',
    supportedLngs: ['en', 'vi'],
    nonExplicitSupportedLngs: true, // vi-VN → vi
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    returnNull: false,
  });

// Keep <html lang> in sync with the active language.
function syncHtmlLang(lng: string): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.split('-')[0];
  }
}
syncHtmlLang(i18n.language || 'en');
i18n.on('languageChanged', syncHtmlLang);

// Wire Zod v4 validation messages to i18next (replaces zod-i18n-map, which is v3-only).
z.config({ customError: createZodErrorMap(i18n) });

export default i18n;
