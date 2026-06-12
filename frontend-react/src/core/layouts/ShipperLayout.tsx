import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Truck, Bell, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { NotificationBell } from '@/features/notification';
import { PortalAccountDropdown } from './PortalAccountDropdown';

const shipperLinks: Array<{ to: string; label: string; icon: LucideIcon; permission: string }> = [
  { to: '/shipper/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { to: '/shipper/deliveries', label: 'Deliveries', icon: Truck, permission: PERMISSIONS.ORDERS_READ },
  { to: '/shipper/notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.PORTAL_SHIPPER },
];

export function ShipperLayout() {
  const { hasPermission } = usePermissions();

  const visibleLinks = shipperLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-emerald-900 text-white">
        <div className="p-6 text-lg font-bold">Shipper Portal</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded px-3 py-2 text-sm ${isActive ? 'bg-emerald-800' : 'hover:bg-emerald-800/60'}`
                }
              >
                <Icon className="h-4 w-4 opacity-70" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-emerald-800/60 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded px-3 py-2.5 text-sm text-emerald-300/80 transition-colors hover:bg-emerald-800/60 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            <span>
              Back to <span className="font-semibold text-emerald-100">Nook</span>
            </span>
          </Link>
        </div>
      </aside>
      <main className="flex flex-1 flex-col bg-gray-50/50">
        <header className="sticky top-0 z-20 flex items-center justify-end gap-2 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
          <NotificationBell />
          <PortalAccountDropdown />
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
