import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-300">403</h1>
      <p className="text-lg text-gray-500">Access denied</p>
      <Link to={ROUTES.HOME} className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </div>
  );
}
