import { describe, it, expect, beforeEach } from 'vitest';
import { interpolate, translate, getMessages } from './i18n';
import { useI18nStore } from './i18n.store';
import { vi as viLocale } from './locales/vi';
import { en } from './locales/en';

describe('interpolate', () => {
  it('should return template unchanged when no params', () => {
    expect(interpolate('Hello world')).toBe('Hello world');
  });

  it('should return template unchanged when params is undefined', () => {
    expect(interpolate('Hello {name}', undefined)).toBe('Hello {name}');
  });

  it('should replace single param', () => {
    expect(interpolate('Hello {name}', { name: 'John' })).toBe('Hello John');
  });

  it('should replace multiple params', () => {
    expect(interpolate('{greeting} {name}!', { greeting: 'Hi', name: 'John' })).toBe('Hi John!');
  });

  it('should handle number params', () => {
    expect(interpolate('Total: {amount}đ', { amount: 250000 })).toBe('Total: 250000đ');
  });

  it('should preserve placeholder on missing param (typo debugging)', () => {
    expect(interpolate('Hello {name}', { nme: 'John' })).toBe('Hello {name}');
  });

  it('should replace found params and preserve missing ones', () => {
    expect(interpolate('{a} and {b}', { a: 'X' })).toBe('X and {b}');
  });

  it('should handle empty params object', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
  });

  it('should handle template with no placeholders', () => {
    expect(interpolate('No placeholders here', { name: 'John' })).toBe('No placeholders here');
  });

  it('should handle param value of 0', () => {
    expect(interpolate('Count: {count}', { count: 0 })).toBe('Count: 0');
  });

  it('should handle empty string param value', () => {
    expect(interpolate('Name: {name}', { name: '' })).toBe('Name: ');
  });
});

describe('translate', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'vi' });
  });

  it('should translate using store locale (vi)', () => {
    const result = translate((m) => m.toast.order.placed);
    expect(result).toBe(viLocale.toast.order.placed);
  });

  it('should translate using store locale (en)', () => {
    useI18nStore.setState({ locale: 'en' });
    const result = translate((m) => m.toast.order.placed);
    expect(result).toBe(en.toast.order.placed);
  });

  it('should use explicit locale override', () => {
    useI18nStore.setState({ locale: 'vi' });
    const result = translate((m) => m.toast.order.placed, undefined, 'en');
    expect(result).toBe(en.toast.order.placed);
  });

  it('should support interpolation', () => {
    const result = translate(() => 'Hello {name}', { name: 'World' });
    expect(result).toBe('Hello World');
  });
});

describe('getMessages', () => {
  beforeEach(() => {
    useI18nStore.setState({ locale: 'vi' });
  });

  it('should return vi messages by default', () => {
    const messages = getMessages();
    expect(messages.toast.order.placed).toBe(viLocale.toast.order.placed);
  });

  it('should return en messages when locale is en', () => {
    useI18nStore.setState({ locale: 'en' });
    const messages = getMessages();
    expect(messages.toast.order.placed).toBe(en.toast.order.placed);
  });

  it('should return messages for explicit locale', () => {
    const messages = getMessages('en');
    expect(messages.toast.order.placed).toBe(en.toast.order.placed);
  });
});
