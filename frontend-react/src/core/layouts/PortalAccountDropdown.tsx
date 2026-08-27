import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, ExternalLink, Store, Check, Bell, Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { PERMISSIONS } from '@/common/constants/permissions';
import { useNotificationRoutes } from '@/features/notification';
import { useThemeStore, type ThemeMode } from '@/common/theme';
import { getVisiblePortals } from './portal-links.util';

const themeOptions: Array<{ mode: ThemeMode; label: string; icon: LucideIcon }> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

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

  // Close the dropdown on navigation. Adjust state during render (React docs:
  // "storing info from previous renders") instead of an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const visiblePortals = getVisiblePortals(hasPermission);
  const isSeller = hasPermission(PERMISSIONS.SHOPS_READ);
  const { notificationsPath } = useNotificationRoutes();

  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden max-w-32 truncate text-sm font-medium md:inline">
          {user?.full_name || 'Account'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform dark:text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-neutral-200/80 bg-white py-1 shadow-lg shadow-neutral-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-slate-800">
            <p className="max-w-[200px] truncate text-sm font-medium text-neutral-900 dark:text-slate-100">
              {user?.full_name}
            </p>
            <p className="max-w-[200px] truncate text-xs text-neutral-500 dark:text-slate-400">
              {user?.email}
            </p>
          </div>

          <div className="border-b border-neutral-100 px-3 py-2.5 dark:border-slate-800">
            <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-slate-500">
              Appearance
            </p>
            <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-0.5 dark:bg-slate-800">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = option.mode === themeMode;
                return (
                  <button
                    key={option.mode}
                    onClick={() => setThemeMode(option.mode)}
                    aria-pressed={active}
                    title={option.label}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                        : 'text-neutral-500 hover:text-neutral-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isSeller && pathname.startsWith('/seller') && (
            <div className="border-b border-neutral-100 py-1 dark:border-slate-800">
              <Link
                to={ROUTES.SELLER_SHOP}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Store className="h-4 w-4" />
                Shop Info
              </Link>
            </div>
          )}

          <div className="border-b border-neutral-100 py-1 dark:border-slate-800">
            <Link
              to={notificationsPath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Link>
          </div>

          {visiblePortals.length > 0 && (
            <div className="border-b border-neutral-100 py-1 dark:border-slate-800">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-slate-500">
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
                        ? 'bg-neutral-50 font-medium text-neutral-900 dark:bg-slate-800 dark:text-slate-100'
                        : `hover:bg-neutral-50 dark:hover:bg-slate-800 ${portal.accent}`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {portal.label}
                    {isCurrent && <Check className="ml-auto h-3.5 w-3.5 text-neutral-400 dark:text-slate-500" />}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-b border-neutral-100 py-1 dark:border-slate-800">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <ExternalLink className="h-4 w-4" />
              Back to Store
            </Link>
          </div>

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors dark:text-rose-400 dark:hover:bg-slate-800"
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
