import { useEffect } from 'react';
import { useThemeStore } from './theme.store';
import { applyTheme } from './theme.util';

/**
 * Keeps the DOM in sync with the persisted theme mode.
 * - Applies the current mode once on mount (covers hydration after the FOUC script).
 * - While mode is `system`, listens for OS theme changes and re-applies live.
 * Mount once, high in the tree (see AppProviders).
 */
export function useThemeSync(): void {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);

    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);
}
