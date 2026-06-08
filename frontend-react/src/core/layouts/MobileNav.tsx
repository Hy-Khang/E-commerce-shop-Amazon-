import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Package, MapPin, MessageSquare, Heart, LogOut, Shield, Store, Truck } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { useCategories } from '@/features/product';
import { ROUTES } from '@/common/constants/routes';
import { Drawer } from '@/common/components/ui/Drawer';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();
  const { data: categories } = useCategories();
  const navigate = useNavigate();
  const rootCategories = categories?.filter((c) => !c.parent_id)?.slice(0, 10) ?? [];

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = (formData.get('search') as string).trim();
    if (query) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(query)}`);
      onClose();
    }
  }

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu">
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSearch} className="relative">
          <input
            name="search"
            type="text"
            placeholder="Search products..."
            className="shop-input pr-10"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-brand transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 rounded-lg bg-brand-light px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{user.full_name}</p>
              <p className="truncate text-xs text-text-secondary">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to={ROUTES.LOGIN}
              onClick={onClose}
              className="flex-1 rounded-lg border border-border-brand px-3 py-2 text-center text-sm font-medium text-text-brand hover:bg-brand-light transition-colors"
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.REGISTER}
              onClick={onClose}
              className="flex-1 rounded-lg bg-brand px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-hover transition-colors"
            >
              Register
            </Link>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Shop</p>
          <nav className="flex flex-col">
            <MobileNavLink to={ROUTES.PRODUCTS} onClick={onClose}>
              All Products
            </MobileNavLink>
            {rootCategories.map((cat) => (
              <MobileNavLink key={cat.id} to={ROUTES.CATEGORY(cat.slug)} onClick={onClose}>
                {cat.name}
              </MobileNavLink>
            ))}
          </nav>
        </div>

        {isAuthenticated && (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Account</p>
              <nav className="flex flex-col">
                <MobileNavLink to={ROUTES.PROFILE} icon={User} onClick={onClose}>My Profile</MobileNavLink>
                <MobileNavLink to={ROUTES.ORDERS} icon={Package} onClick={onClose}>Orders</MobileNavLink>
                <MobileNavLink to={ROUTES.ADDRESSES} icon={MapPin} onClick={onClose}>Addresses</MobileNavLink>
                <MobileNavLink to={ROUTES.MY_REVIEWS} icon={MessageSquare} onClick={onClose}>My Reviews</MobileNavLink>
                <MobileNavLink to={ROUTES.WISHLIST} icon={Heart} onClick={onClose}>Wishlist</MobileNavLink>
              </nav>
            </div>

            <MobilePortalLinks role={user?.role} onClose={onClose} />

            <button
              onClick={() => { logout(); onClose(); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-error-500 hover:bg-neutral-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </Drawer>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  onClick,
  children,
}: {
  to: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </Link>
  );
}

const mobilePortalConfig = [
  { role: 'admin', to: ROUTES.ADMIN_DASHBOARD, label: 'Admin Portal', icon: Shield, bg: 'bg-slate-50', text: 'text-slate-700' },
  { role: 'seller', to: ROUTES.SELLER_DASHBOARD, label: 'Seller Center', icon: Store, bg: 'bg-amber-50', text: 'text-amber-800' },
  { role: 'shipper', to: ROUTES.SHIPPER_DASHBOARD, label: 'Shipper Portal', icon: Truck, bg: 'bg-emerald-50', text: 'text-emerald-800' },
];

function MobilePortalLinks({ role, onClose }: { role?: string; onClose: () => void }) {
  if (!role || role === 'customer') return null;

  const visible = role === 'admin'
    ? mobilePortalConfig.filter((p) => p.role === 'admin' || p.role === 'seller')
    : mobilePortalConfig.filter((p) => p.role === role);

  if (visible.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Manage</p>
      <nav className="flex flex-col gap-1">
        {visible.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.role}
              to={portal.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${portal.bg} ${portal.text}`}
            >
              <Icon className="h-4 w-4" />
              {portal.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
