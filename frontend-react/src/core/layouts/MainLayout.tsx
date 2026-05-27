import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { CartBadge } from '@/features/cart';
import { ROUTES } from '@/common/constants/routes';
import { UserDropdown } from './UserDropdown';

export function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to={ROUTES.HOME} className="text-xl font-bold">Shop</Link>
          <nav className="flex items-center gap-4">
            <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-600 hover:text-gray-900">
              Products
            </Link>
            <CartBadge />
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <>
                <Link to={ROUTES.LOGIN} className="text-sm text-gray-600 hover:text-gray-900">
                  Sign in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Shop. All rights reserved.
      </footer>
    </div>
  );
}
