import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

interface Props {
  role: string;
}

export function RoleGuard({ role }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user || user.role !== role) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
