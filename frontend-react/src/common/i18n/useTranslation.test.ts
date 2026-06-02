import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from './useTranslation';
import { useI18nStore } from './i18n.store';
import { vi as viLocale } from './locales/vi';
import { en } from './locales/en';

describe('useTranslation', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'vi' });
  });

  it('should return current locale', () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.locale).toBe('vi');
  });

  it('should translate with selector (vi)', () => {
    const { result } = renderHook(() => useTranslation());
    const text = result.current.t((m) => m.toast.order.placed);
    expect(text).toBe(viLocale.toast.order.placed);
  });

  it('should translate with selector (en)', () => {
    useI18nStore.setState({ locale: 'en' });
    const { result } = renderHook(() => useTranslation());
    const text = result.current.t((m) => m.toast.order.placed);
    expect(text).toBe(en.toast.order.placed);
  });

  it('should support interpolation params', () => {
    const { result } = renderHook(() => useTranslation());
    const text = result.current.t(() => 'Hello {name}', { name: 'World' });
    expect(text).toBe('Hello World');
  });

  it('should update translations when locale changes', () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.t((m) => m.toast.wishlist.added)).toBe(viLocale.toast.wishlist.added);

    act(() => {
      result.current.setLocale('en');
    });

    expect(result.current.locale).toBe('en');
    expect(result.current.t((m) => m.toast.wishlist.added)).toBe(en.toast.wishlist.added);
  });

  it('should provide setLocale function', () => {
    const { result } = renderHook(() => useTranslation());
    expect(typeof result.current.setLocale).toBe('function');
  });
});
