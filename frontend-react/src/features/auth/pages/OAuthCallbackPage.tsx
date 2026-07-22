import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { useMergeCart } from '@/features/cart/hooks/useMergeCart';
import { cartKeys } from '@/features/cart/hooks/useCart';
import { ROUTES } from '@/common/constants/routes';
import { Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { mutateAsync: mergeCart } = useMergeCart();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || exchanged.current) return;
    exchanged.current = true;

    (async () => {
      try {
        const response = await authService.exchangeOAuthCode(code);
        const userData = response.data.data;
        login(userData);

        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
          try {
            await mergeCart(sessionId);
            queryClient.invalidateQueries({ queryKey: cartKeys.current() });
          } catch {
            // Cart merge failure is non-critical
          }
        }

        const role = userData.user.role;
        if (role === 'admin') {
          navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        } else if (role === 'seller') {
          navigate(ROUTES.SELLER_DASHBOARD, { replace: true });
        } else if (role === 'shipper') {
          navigate(ROUTES.SHIPPER_DASHBOARD, { replace: true });
        } else {
          navigate(ROUTES.HOME, { replace: true });
        }
      } catch {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3000);
      }
    })();
  }, [searchParams, login, mergeCart, queryClient, navigate]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="rounded-md bg-rose-50 px-6 py-4 text-sm text-rose-600">
          {error}
        </div>
        <p className="text-sm text-text-secondary">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-text-brand" />
      <p className="text-sm text-text-secondary">Completing sign in...</p>
    </div>
  );
}
