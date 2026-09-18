import type { i18n as I18nInstance } from 'i18next';
import type { $ZodErrorMap, $ZodRawIssue } from 'zod/v4/core';

/**
 * Build a Zod v4 global error map wired to the i18next instance.
 * Registered once in config.ts via `z.config({ customError })`.
 *
 * Only fires for issues WITHOUT an inline custom message (Zod uses the inline
 * message when present) — so validation schemas should omit literal messages
 * and let this map supply the localized copy. Custom `.refine`/`.check` copy
 * passes an i18n key via `params.i18n`.
 */
export function createZodErrorMap(i18n: I18nInstance): $ZodErrorMap {
  // Loose-typed shim: keys are resolved dynamically from Zod issues, so the
  // strict per-namespace key typing doesn't apply here.
  const rawT = i18n.t as unknown as (key: string, opts?: Record<string, unknown>) => string;
  const tv = (key: string, vars?: Record<string, unknown>): string =>
    rawT(key, { ns: 'validation', ...vars });

  return (issue: $ZodRawIssue) => {
    // Explicit i18n key from a custom refine/check.
    const custom = (issue as { params?: Record<string, unknown> }).params?.i18n;
    if (typeof custom === 'string') return tv(custom, issue as Record<string, unknown>);

    switch (issue.code) {
      case 'invalid_type': {
        const expected = (issue as { expected?: string }).expected;
        if (issue.input === undefined || issue.input === null) return tv('required');
        if (expected === 'number' || expected === 'int') return tv('invalidNumber');
        return tv('invalidType');
      }
      case 'too_small': {
        const { origin, minimum } = issue as { origin?: string; minimum?: number };
        const min = Number(minimum);
        if (origin === 'string') return min <= 1 ? tv('tooSmallStringOne') : tv('tooSmallStringMin', { minimum: min });
        if (origin === 'array' || origin === 'set') return tv('tooSmallArrayMin', { minimum: min });
        return tv('tooSmallNumberMin', { minimum: min });
      }
      case 'too_big': {
        const { origin, maximum } = issue as { origin?: string; maximum?: number };
        const max = Number(maximum);
        if (origin === 'string') return tv('tooBigStringMax', { maximum: max });
        if (origin === 'array' || origin === 'set') return tv('tooBigArrayMax', { maximum: max });
        return tv('tooBigNumberMax', { maximum: max });
      }
      case 'invalid_format': {
        const format = (issue as { format?: string }).format;
        if (format === 'email') return tv('invalidEmail');
        if (format === 'url') return tv('invalidUrl');
        return tv('invalidString');
      }
      case 'not_multiple_of':
        return tv('notInteger');
      case 'invalid_value':
        return tv('invalidEnum');
      default:
        // Fall back to Zod's built-in message for unhandled codes.
        return undefined;
    }
  };
}
