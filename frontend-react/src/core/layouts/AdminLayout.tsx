import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Shield,
  KeyRound,
  MessageSquare,
  Heart,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';

const adminLinks: Array<{ to: string; label: string; icon: LucideIcon; permission: string }> = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { to: '/admin/products', label: 'Products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, permission: PERMISSIONS.CATEGORIES_READ },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
  { to: '/admin/users', label: 'Users', icon: Users, permission: PERMISSIONS.USERS_READ },
  { to: '/admin/roles', label: 'Roles', icon: Shield, permission: PERMISSIONS.ROLES_READ },
  { to: '/admin/permissions', label: 'Permissions', icon: KeyRound, permission: PERMISSIONS.PERMISSIONS_READ },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare, permission: PERMISSIONS.REVIEWS_READ },
  { to: '/admin/wishlist', label: 'Wishlist', icon: Heart, permission: PERMISSIONS.WISHLIST_READ },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag, permission: PERMISSIONS.COUPONS_READ },
];

export function AdminLayout() {
  const { hasPermission } = usePermissions();

  const visibleLinks = adminLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-900 text-white">
        <div className="p-6 text-lg font-bold">Admin Panel</div>
        <nav className="flex flex-col gap-1 px-3">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`
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
