import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-neutral-300">404</h1>
      <p className="text-lg text-text-secondary">Page not found</p>
      <Link to={ROUTES.HOME} className="text-text-brand hover:text-primary-700 transition-colors">
        Go back home
      </Link>
    </div>
  );
}
