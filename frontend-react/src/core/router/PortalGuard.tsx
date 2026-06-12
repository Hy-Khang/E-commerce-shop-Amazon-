import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

interface Props {
  requiredPermission: string;
}

export function PortalGuard({ requiredPermission }: Props) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
