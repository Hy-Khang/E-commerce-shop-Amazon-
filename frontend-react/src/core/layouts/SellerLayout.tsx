import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Store, Tag, Zap, Star, Heart, MessageCircle, ExternalLink } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { NotificationBell } from '@/features/notification';
import { useChatUnreadBadge } from '@/features/chat';
import { ROUTES } from '@/common/constants/routes';
import { PortalAccountDropdown } from './PortalAccountDropdown';
import { SellerGlobalSearch } from './SellerGlobalSearch';

const sellerLinks: Array<{ to: string; label: string; icon: LucideIcon; permission: string }> = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
  { to: '/seller/shop', label: 'Shop Settings', icon: Store, permission: PERMISSIONS.SHOPS_READ },
  { to: '/seller/products', label: 'Products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
  { to: '/seller/chat', label: 'Messages', icon: MessageCircle, permission: PERMISSIONS.SHOPS_READ },
  { to: '/seller/coupons', label: 'Coupons', icon: Tag, permission: PERMISSIONS.COUPONS_READ },
  { to: '/seller/flash-sales', label: 'Flash Sale', icon: Zap, permission: PERMISSIONS.FLASH_REGISTRATIONS_READ },
  { to: '/seller/reviews', label: 'Reviews', icon: Star, permission: PERMISSIONS.REVIEWS_READ },
  { to: '/seller/wishlist', label: 'Wishlist', icon: Heart, permission: PERMISSIONS.WISHLIST_READ },
];

export function SellerLayout() {
  const { hasPermission } = usePermissions();
  const chatUnread = useChatUnreadBadge();

  const visibleLinks = sellerLinks.filter((link) => hasPermission(link.permission));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-amber-900 text-white">
        <div className="p-6 text-lg font-bold">Seller Center</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const badge = link.to === ROUTES.SELLER_CHAT ? chatUnread : 0;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded px-3 py-2 text-sm ${isActive ? 'bg-amber-800' : 'hover:bg-amber-800/60'}`
                }
              >
                <Icon className="h-4 w-4 opacity-70" />
                <span className="flex-1">{link.label}</span>
                {badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-amber-950">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
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
      <main className="flex flex-1 flex-col bg-slate-50/50 dark:bg-slate-950">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1">
            <SellerGlobalSearch />
          </div>
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
