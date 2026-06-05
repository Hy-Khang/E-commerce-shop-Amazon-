import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

interface Props {
  allowedRoles: string[];
}

export function PortalGuard({ allowedRoles }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
