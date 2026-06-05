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

const adminLinks: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: Shield },
  { to: '/admin/permissions', label: 'Permissions', icon: KeyRound },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/admin/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-900 text-white">
        <div className="p-6 text-lg font-bold">Admin Panel</div>
        <nav className="flex flex-col gap-1 px-3">
          {adminLinks.map((link) => {
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
