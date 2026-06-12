import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, ExternalLink, Store, Check, Bell } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { PERMISSIONS } from '@/common/constants/permissions';
import { useNotificationRoutes } from '@/features/notification';
import { getVisiblePortals } from './portal-links.util';

export function PortalAccountDropdown() {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const visiblePortals = getVisiblePortals(hasPermission);
  const isSeller = hasPermission(PERMISSIONS.SHOPS_READ);
  const { notificationsPath } = useNotificationRoutes();

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden max-w-32 truncate text-sm font-medium md:inline">
          {user?.full_name || 'Account'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-neutral-200/80 bg-white py-1 shadow-lg shadow-neutral-900/5">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="max-w-[200px] truncate text-sm font-medium text-neutral-900">
              {user?.full_name}
            </p>
            <p className="max-w-[200px] truncate text-xs text-neutral-500">
              {user?.email}
            </p>
          </div>

          {isSeller && pathname.startsWith('/seller') && (
            <div className="border-b border-neutral-100 py-1">
              <Link
                to={ROUTES.SELLER_SHOP}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
              >
                <Store className="h-4 w-4" />
                Shop Info
              </Link>
            </div>
          )}

          <div className="border-b border-neutral-100 py-1">
            <Link
              to={notificationsPath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
          </div>

          {visiblePortals.length > 0 && (
            <div className="border-b border-neutral-100 py-1">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Portals
              </p>
              {visiblePortals.map((portal) => {
                const Icon = portal.icon;
                const isCurrent = pathname.startsWith(portal.pathPrefix);
                return (
                  <Link
                    key={portal.role}
                    to={portal.to}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      isCurrent
                        ? 'bg-neutral-50 font-medium text-neutral-900'
                        : `hover:bg-neutral-50 ${portal.accent}`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {portal.label}
                    {isCurrent && <Check className="ml-auto h-3.5 w-3.5 text-neutral-400" />}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-b border-neutral-100 py-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Back to Store
            </Link>
          </div>

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
