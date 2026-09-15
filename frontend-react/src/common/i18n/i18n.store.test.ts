import { describe, it, expect, beforeEach } from 'vitest';
import { useI18nStore } from './i18n.store';

describe('useI18nStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useI18nStore.setState({ locale: 'en' });
  });

  it('should default to en locale', () => {
    expect(useI18nStore.getState().locale).toBe('en');
  });

  it('should change locale via setLocale', () => {
    useI18nStore.getState().setLocale('vi');
    expect(useI18nStore.getState().locale).toBe('vi');
  });

  it('should switch back to en', () => {
    useI18nStore.getState().setLocale('vi');
    useI18nStore.getState().setLocale('en');
    expect(useI18nStore.getState().locale).toBe('en');
  });

  it('should persist locale to localStorage', () => {
    useI18nStore.getState().setLocale('en');
    const stored = JSON.parse(localStorage.getItem('i18n-locale') ?? '{}');
    expect(stored.state.locale).toBe('en');
  });
});
