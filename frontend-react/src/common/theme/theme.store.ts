import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyTheme, THEME_STORAGE_KEY, type ThemeMode } from './theme.util';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
    }),
    { name: THEME_STORAGE_KEY },
  ),
);
