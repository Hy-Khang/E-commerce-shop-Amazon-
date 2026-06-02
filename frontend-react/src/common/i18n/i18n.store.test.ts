import { describe, it, expect, beforeEach } from 'vitest';
import { useI18nStore } from './i18n.store';

describe('useI18nStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useI18nStore.setState({ locale: 'vi' });
  });

  it('should default to vi locale', () => {
    expect(useI18nStore.getState().locale).toBe('vi');
  });

  it('should change locale via setLocale', () => {
    useI18nStore.getState().setLocale('en');
    expect(useI18nStore.getState().locale).toBe('en');
  });

  it('should switch back to vi', () => {
    useI18nStore.getState().setLocale('en');
    useI18nStore.getState().setLocale('vi');
    expect(useI18nStore.getState().locale).toBe('vi');
  });

  it('should persist locale to localStorage', () => {
    useI18nStore.getState().setLocale('en');
    const stored = JSON.parse(localStorage.getItem('i18n-locale') ?? '{}');
    expect(stored.state.locale).toBe('en');
  });
});
