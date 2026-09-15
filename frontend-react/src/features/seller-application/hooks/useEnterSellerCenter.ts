import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/features/auth/services/auth.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { ROUTES } from '@/common/constants/routes';
import { showErrorToast } from '@/common/components/feedback/toast';

/**
 * After an application is approved the user's role changed server-side, but the
 * current access token still carries the old role. Refresh the token pair (new
 * role baked in) + re-fetch the profile (new permissions) before entering the
 * Seller Center, so the PortalGuard passes without a full re-login.
 */
export function useEnterSellerCenter() {
  const navigate = useNavigate();
  const [isEntering, setIsEntering] = useState(false);

  const enter = async () => {
    setIsEntering(true);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshed = await authService.refresh(refreshToken);
        localStorage.setItem('accessToken', refreshed.data.data.accessToken);
        localStorage.setItem('refreshToken', refreshed.data.data.refreshToken);
        const me = await authService.getMe();
        useAuthStore.getState().updateUserState(me.data.data);
      }
      navigate(ROUTES.SELLER_DASHBOARD);
    } catch (error) {
      showErrorToast(error as Error);
    } finally {
      setIsEntering(false);
    }
  };

  return { enter, isEntering };
}
