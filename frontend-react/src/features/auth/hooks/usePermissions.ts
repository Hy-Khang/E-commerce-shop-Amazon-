import { useAuthStore } from '../stores/auth.store';

export function usePermissions() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  return { permissions, hasPermission, hasAnyPermission };
}
