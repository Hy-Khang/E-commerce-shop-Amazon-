import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
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
  Zap,
  Store,
  Coins,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { NotificationBell } from '@/features/notification';
import { PortalAccountDropdown } from './PortalAccountDropdown';
import { AdminGlobalSearch } from './AdminGlobalSearch';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: string;
};

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_READ },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package, permission: PERMISSIONS.PRODUCTS_READ },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree, permission: PERMISSIONS.CATEGORIES_READ },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, permission: PERMISSIONS.ORDERS_READ },
      { to: '/admin/shops', label: 'Shops', icon: Store, permission: PERMISSIONS.SHOPS_READ },
      { to: '/admin/coupons', label: 'Coupons', icon: Tag, permission: PERMISSIONS.COUPONS_READ },
      { to: '/admin/flash-sales', label: 'Flash Sale', icon: Zap, permission: PERMISSIONS.FLASH_SALES_READ },
    ],
  },
  {
    label: 'Users',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users, permission: PERMISSIONS.USERS_READ },
      { to: '/admin/roles', label: 'Roles', icon: Shield, permission: PERMISSIONS.ROLES_READ },
      { to: '/admin/permissions', label: 'Permissions', icon: KeyRound, permission: PERMISSIONS.PERMISSIONS_READ },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare, permission: PERMISSIONS.REVIEWS_READ },
      { to: '/admin/wishlist', label: 'Wishlist', icon: Heart, permission: PERMISSIONS.WISHLIST_READ },
      { to: '/admin/ai-conversations', label: 'AI Conversations', icon: Bot, permission: PERMISSIONS.AI_CHATBOX_READ },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings/coins', label: 'Coin Settings', icon: Coins, permission: PERMISSIONS.SETTINGS_READ },
      { to: '/admin/ai-settings', label: 'AI Chatbox', icon: Bot, permission: PERMISSIONS.AI_CHATBOX_UPDATE },
    ],
  },
];

const SIDEBAR_KEY = 'admin-sidebar-collapsed';

export function AdminLayout() {
  const { hasPermission } = usePermissions();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, String(collapsed));
    } catch {
      /* localStorage unavailable (private mode / quota) — non-fatal */
    }
  }, [collapsed]);

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`${collapsed ? 'w-[68px]' : 'w-64'} flex flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 text-white transition-all duration-200`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Admin</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {filteredSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'border-l-[3px] border-teal-400 bg-white/10 font-medium text-white'
                            : 'border-l-[3px] border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                        } ${collapsed ? 'justify-center px-2' : ''}`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <Link
            to="/"
            title={collapsed ? 'Back to Store' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span>
                Back to <span className="font-semibold text-slate-200">Nook</span>
              </span>
            )}
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1">
            <AdminGlobalSearch />
          </div>
          <NotificationBell />
          <PortalAccountDropdown />
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="motion-safe:animate-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
