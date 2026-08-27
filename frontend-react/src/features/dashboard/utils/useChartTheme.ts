import { useEffect, useState } from 'react';
import { useThemeStore, resolveTheme, type ResolvedTheme } from '@/common/theme';

/**
 * Recharts takes literal color strings (`stroke="#f0f0f0"`, `tick={{ fill }}`),
 * which Tailwind's `dark:` variant can't reach. This hook resolves the active
 * theme (reactively, including OS-level changes while in `system` mode) and
 * returns concrete chart colors for both themes.
 */
export interface ChartTheme {
  resolved: ResolvedTheme;
  /** CartesianGrid stroke */
  grid: string;
  /** Axis tick fill */
  axis: string;
}

const LIGHT: Omit<ChartTheme, 'resolved'> = {
  grid: '#f0f0f0',
  axis: '#9ca3af', // gray-400
};

const DARK: Omit<ChartTheme, 'resolved'> = {
  grid: '#1e293b', // slate-800
  axis: '#64748b', // slate-500
};

export function useChartTheme(): ChartTheme {
  const mode = useThemeStore((s) => s.mode);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(mode));

  // Re-resolve when `mode` changes — adjust state during render (React docs:
  // "storing info from previous renders") instead of an effect, to avoid a
  // setState-in-effect cascade.
  const [prevMode, setPrevMode] = useState(mode);
  if (mode !== prevMode) {
    setPrevMode(mode);
    setResolved(resolveTheme(mode));
  }

  // In `system` mode, re-resolve when the OS preference flips. The effect is
  // used only to subscribe to the external matchMedia system.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return { resolved, ...(resolved === 'dark' ? DARK : LIGHT) };
}
