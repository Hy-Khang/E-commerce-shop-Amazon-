type DeepStringify<T> =
  T extends string
    ? string
    : T extends object
      ? { [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type Locale = 'vi' | 'en';

export type TranslationSchema = DeepStringify<typeof import('./locales/vi').vi>;
