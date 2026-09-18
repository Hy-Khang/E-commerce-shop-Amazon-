import { toast } from 'sonner';
import { ApiError } from '@/core/api/api.types';
import { resolveApiErrorMessage } from '@/common/i18n';

export function showSuccessToast(message: string, id?: string) {
  toast.success(message, { id });
}

export function showErrorToast(error: unknown, fallbackMessage?: string, id?: string) {
  let message: string;
  if (typeof error === 'string' && error) {
    // Caller passed a ready-made message string.
    message = error;
  } else if (error instanceof ApiError || (error instanceof Error && error.message)) {
    // Localize by backend error code (falls back to the raw backend message).
    message = resolveApiErrorMessage(error);
  } else {
    // Unknown throwable → caller fallback, else the generic localized message.
    message = fallbackMessage ?? resolveApiErrorMessage(error);
  }
  toast.error(message, { id });
}

export function showInfoToast(message: string, id?: string) {
  toast.info(message, { id });
}

export function showWarningToast(message: string, id?: string) {
  toast.warning(message, { id });
}
