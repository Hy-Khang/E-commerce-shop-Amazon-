import i18n from './config';
import { ApiError } from '@/core/api/api.types';

/**
 * Localize a thrown API error for display.
 * - `ApiError` with a known backend `code` → translated `errors:<code>`.
 * - `ApiError` with an unmapped code → the raw backend `error.message` (defaultValue).
 * - Any other Error → its message.
 * - Unknown → the generic fallback.
 */
export function resolveApiErrorMessage(error: unknown): string {
  // Loose-typed shim: error codes are dynamic backend strings.
  const te = i18n.t as unknown as (key: string, opts?: Record<string, unknown>) => string;
  if (error instanceof ApiError) {
    return te(error.code, {
      ns: 'errors',
      defaultValue: error.message || te('generic', { ns: 'errors' }),
    });
  }
  if (error instanceof Error && error.message) return error.message;
  return te('generic', { ns: 'errors' });
}
