import { Link, Outlet } from 'react-router-dom';
import { useAuthStore, useLogout } from '@/features/auth';
import { CartBadge } from '@/features/cart';
import { ROUTES } from '@/common/constants/routes';

export function MainLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to={ROUTES.HOME} className="text-xl font-bold">Shop</Link>
          <nav className="flex items-center gap-4">
            <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-600 hover:text-gray-900">
              Products
            </Link>
            {isAuthenticated ? (
              <>
                <CartBadge />
                <Link to={ROUTES.ORDERS} className="text-sm text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
                <Link to={ROUTES.PROFILE} className="text-sm text-gray-600 hover:text-gray-900">
                  {user?.full_name || 'Profile'}
                </Link>
                <button
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
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
