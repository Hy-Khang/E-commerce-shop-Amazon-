import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ApiError } from '@/core/api/api.types';
import { i18n } from '@/common/i18n';

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
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('en');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
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
    it('should localize a known ApiError code', () => {
      const error = new ApiError('CART_003', 'Variant out of stock', 400);
      showErrorToast(error);
      expect(toast.error).toHaveBeenCalledWith('This item is out of stock.', { id: undefined });
    });

    it('should fall back to the raw backend message for an unmapped code', () => {
      const error = new ApiError('WEIRD_999', 'Totally unexpected backend message', 400);
      showErrorToast(error);
      expect(toast.error).toHaveBeenCalledWith('Totally unexpected backend message', { id: undefined });
    });

    it('should extract message from standard Error', () => {
      showErrorToast(new Error('Network error'));
      expect(toast.error).toHaveBeenCalledWith('Network error', { id: undefined });
    });

    it('should treat a string error as the message', () => {
      showErrorToast('A literal message');
      expect(toast.error).toHaveBeenCalledWith('A literal message', { id: undefined });
    });

    it('should use fallback when error is unknown', () => {
      showErrorToast({}, 'Custom fallback');
      expect(toast.error).toHaveBeenCalledWith('Custom fallback', { id: undefined });
    });

    it('should use generic i18n message when no error message and no fallback (vi)', async () => {
      await i18n.changeLanguage('vi');
      showErrorToast({});
      expect(toast.error).toHaveBeenCalledWith('Đã có lỗi xảy ra. Vui lòng thử lại.', { id: undefined });
    });

    it('should use en generic message when locale is en', () => {
      showErrorToast({});
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.', { id: undefined });
    });

    it('should prioritize localized API error over fallback', () => {
      const error = new ApiError('CART_004', 'Quantity exceeds stock', 400);
      showErrorToast(error, 'This should not appear');
      expect(toast.error).toHaveBeenCalledWith('The requested quantity exceeds available stock.', {
        id: undefined,
      });
    });

    it('should pass dedup id', () => {
      showErrorToast(new Error('fail'), undefined, 'cart-error');
      expect(toast.error).toHaveBeenCalledWith('fail', { id: 'cart-error' });
    });

    it('should handle null error', () => {
      showErrorToast(null);
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.', { id: undefined });
    });

    it('should handle undefined error', () => {
      showErrorToast(undefined);
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.', { id: undefined });
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
