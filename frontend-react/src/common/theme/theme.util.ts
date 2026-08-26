export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key — shared with the FOUC script in index.html. Must stay in sync. */
export const THEME_STORAGE_KEY = 'theme';

/** Resolve a theme mode to a concrete light/dark value, reading the OS preference for `system`. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

/**
 * Apply a theme to the document by toggling the `.dark` class on <html>.
 * `color-scheme` is driven purely by CSS (`:root` / `:root.dark` in globals.css),
 * so we never set an inline style that could fight the stylesheet.
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}
