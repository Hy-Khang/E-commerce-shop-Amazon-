import { toast } from 'sonner';
import { ApiError } from '@/core/api/api.types';
import { translate } from '@/common/i18n';

function extractErrorMessage(error: unknown): string | null {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return null;
}

export function showSuccessToast(message: string, id?: string) {
  toast.success(message, { id });
}

export function showErrorToast(error: unknown, fallbackMessage?: string, id?: string) {
  const message = extractErrorMessage(error)
    ?? fallbackMessage
    ?? translate((m) => m.toast.error.generic);
  toast.error(message, { id });
}

export function showInfoToast(message: string, id?: string) {
  toast.info(message, { id });
}

export function showWarningToast(message: string, id?: string) {
  toast.warning(message, { id });
}
