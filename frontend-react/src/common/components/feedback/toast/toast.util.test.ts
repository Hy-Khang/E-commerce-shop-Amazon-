import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/core/api/api.types';
import { useI18nStore } from '@/common/i18n';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from './toast.util';

describe('toast utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useI18nStore.setState({ locale: 'vi' });
  });

  describe('showSuccessToast', () => {
    it('should call toast.success with message', () => {
      showSuccessToast('Done!');
      expect(toast.success).toHaveBeenCalledWith('Done!', { id: undefined });
    });

    it('should pass dedup id', () => {
      showSuccessToast('Done!', 'wishlist');
      expect(toast.success).toHaveBeenCalledWith('Done!', { id: 'wishlist' });
    });
  });

  describe('showErrorToast', () => {
    it('should extract message from ApiError', () => {
      const error = new ApiError('CART_003', 'Variant out of stock', 400);
      showErrorToast(error);
      expect(toast.error).toHaveBeenCalledWith('Variant out of stock', { id: undefined });
    });

    it('should extract message from standard Error', () => {
      showErrorToast(new Error('Network error'));
      expect(toast.error).toHaveBeenCalledWith('Network error', { id: undefined });
    });

    it('should use fallback when error has no message', () => {
      showErrorToast({}, 'Custom fallback');
      expect(toast.error).toHaveBeenCalledWith('Custom fallback', { id: undefined });
    });

    it('should use generic i18n message when no error message and no fallback', () => {
      showErrorToast({});
      expect(toast.error).toHaveBeenCalledWith('Đã xảy ra lỗi', { id: undefined });
    });

    it('should use en generic message when locale is en', () => {
      useI18nStore.setState({ locale: 'en' });
      showErrorToast({});
      expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred', { id: undefined });
    });

    it('should prioritize API error message over fallback', () => {
      const error = new ApiError('CART_004', 'Quantity exceeds stock', 400);
      showErrorToast(error, 'This should not appear');
      expect(toast.error).toHaveBeenCalledWith('Quantity exceeds stock', { id: undefined });
    });

    it('should pass dedup id', () => {
      showErrorToast(new Error('fail'), undefined, 'cart-error');
      expect(toast.error).toHaveBeenCalledWith('fail', { id: 'cart-error' });
    });

    it('should handle null error', () => {
      showErrorToast(null);
      expect(toast.error).toHaveBeenCalledWith('Đã xảy ra lỗi', { id: undefined });
    });

    it('should handle undefined error', () => {
      showErrorToast(undefined);
      expect(toast.error).toHaveBeenCalledWith('Đã xảy ra lỗi', { id: undefined });
    });
  });

  describe('showInfoToast', () => {
    it('should call toast.info with message', () => {
      showInfoToast('FYI');
      expect(toast.info).toHaveBeenCalledWith('FYI', { id: undefined });
    });
  });

  describe('showWarningToast', () => {
    it('should call toast.warning with message', () => {
      showWarningToast('Careful!');
      expect(toast.warning).toHaveBeenCalledWith('Careful!', { id: undefined });
    });
  });
});
