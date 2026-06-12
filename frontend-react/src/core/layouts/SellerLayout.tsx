import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Store, Bell, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { NotificationBell } from '@/features/notification';
import { PortalAccountDropdown } from './PortalAccountDropdown';

const sellerLinks: Array<{ to: string; label: string; icon: LucideIcon; permission: string }> = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { to: '/seller/shop', label: 'Shop Settings', icon: Store, permission: PERMISSIONS.SHOPS_READ },
  { to: '/seller/products', label: 'Products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
  { to: '/seller/notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.PORTAL_SELLER },
];

export function SellerLayout() {
  const { hasPermission } = usePermissions();

  const visibleLinks = sellerLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-amber-900 text-white">
        <div className="p-6 text-lg font-bold">Seller Center</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded px-3 py-2 text-sm ${isActive ? 'bg-amber-800' : 'hover:bg-amber-800/60'}`
                }
              >
                <Icon className="h-4 w-4 opacity-70" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-amber-800/60 px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded px-3 py-2.5 text-sm text-amber-300/80 transition-colors hover:bg-amber-800/60 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            <span>
              Back to <span className="font-semibold text-amber-100">Nook</span>
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
