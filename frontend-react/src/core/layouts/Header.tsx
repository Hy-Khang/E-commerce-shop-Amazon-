import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, HelpCircle, Shield, Store, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useCategories, SearchBarWithSuggestions } from '@/features/product';
import { CartBadge } from '@/features/cart';
import { WishlistBadge } from '@/features/wishlist';
import { NotificationBell } from '@/features/notification';
import { ROUTES } from '@/common/constants/routes';
import { UserDropdown } from './UserDropdown';
import { MobileNav } from './MobileNav';

export function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border-default/80 bg-white/95 backdrop-blur-md">
      <div className="shop-container flex h-16 items-center gap-4 md:h-[72px] md:gap-8">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-text-secondary hover:bg-neutral-100 transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to={ROUTES.HOME} className="shrink-0">
          <span className="font-display text-[26px] text-text-primary md:text-[30px] tracking-tight">
            Nook<span className="text-brand">.</span>
          </span>
        </Link>

        <SearchBarWithSuggestions />

        <div className="flex items-center gap-0.5 md:gap-1">
          <PortalLinks role={user?.role} />
          {isAuthenticated && <WishlistBadge />}
          {isAuthenticated && <NotificationBell />}
          <CartBadge />
          <div className="hidden md:flex md:items-center md:ml-2">
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={ROUTES.LOGIN}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-neutral-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover shadow-xs"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <NavBar />
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}

function NavBar() {
  const { data: categories } = useCategories();
  const rootCategories = categories?.filter((c) => !c.parent_id)?.slice(0, 8) ?? [];

  return (
    <nav className="hidden border-b border-border-default/50 md:block">
      <div className="shop-container flex h-10 items-center gap-0.5 overflow-x-auto">
        <Link
          to={ROUTES.PRODUCTS}
          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-neutral-100/50 transition-colors"
        >
          All Products
        </Link>
        {rootCategories.map((cat) => (
          <Link
            key={cat.id}
            to={ROUTES.CATEGORY(cat.slug)}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-neutral-100/50 hover:text-text-primary transition-colors"
          >
            {cat.name}
          </Link>
        ))}
        <div className="ml-auto">
          <Link
            to="#"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-neutral-100/50 hover:text-text-secondary transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Help
          </Link>
        </div>
      </div>
    </nav>
  );
}

const portalConfig: Array<{ role: string; to: string; label: string; icon: LucideIcon; color: string }> = [
  { role: 'admin', to: ROUTES.ADMIN_DASHBOARD, label: 'Admin', icon: Shield, color: 'text-slate-600 hover:bg-slate-50' },
  { role: 'seller', to: ROUTES.SELLER_DASHBOARD, label: 'Seller', icon: Store, color: 'text-amber-700 hover:bg-amber-50' },
  { role: 'shipper', to: ROUTES.SHIPPER_DASHBOARD, label: 'Shipper', icon: Truck, color: 'text-emerald-700 hover:bg-emerald-50' },
];

function PortalLinks({ role }: { role?: string }) {
  if (!role || role === 'customer') return null;

  const visiblePortals = role === 'admin'
    ? portalConfig.filter((p) => p.role === 'admin' || p.role === 'seller')
    : portalConfig.filter((p) => p.role === role);

  if (visiblePortals.length === 0) return null;

  return (
    <div className="hidden items-center gap-0.5 lg:flex">
      {visiblePortals.map((portal) => {
        const Icon = portal.icon;
        return (
          <Link
            key={portal.role}
            to={portal.to}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${portal.color}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {portal.label}
          </Link>
        );
      })}
    </div>
  );
}
