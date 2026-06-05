import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';

const sellerLinks: Array<{ to: string; label: string; icon: LucideIcon; permission: string }> = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { to: '/seller/products', label: 'Products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
];

export function SellerLayout() {
  const { hasPermission } = usePermissions();

  const visibleLinks = sellerLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-amber-900 text-white">
        <div className="p-6 text-lg font-bold">Seller Center</div>
        <nav className="flex flex-col gap-1 px-3">
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
      </aside>
      <main className="flex-1 bg-gray-50/50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
