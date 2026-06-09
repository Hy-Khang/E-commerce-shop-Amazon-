import { NavLink, Outlet } from 'react-router-dom';
import { User, MapPin, ShoppingCart, MessageSquare, Heart, Bell } from 'lucide-react';
import { useProfile } from '@/features/user-profile';
import { useOrders } from '@/features/order';
import { useWishlist } from '@/features/wishlist';
import { useMyReviews } from '@/features/review';
import { useNotificationStore } from '@/features/notification';

export default function AccountLayout() {
  const { data: profile } = useProfile();

  // Fetch count query parameters with a limit of 1 to keep them lightweight
  const { data: ordersData } = useOrders({ limit: 1 });
  const { data: wishlistData } = useWishlist({ limit: 1 });
  const { data: reviewsData } = useMyReviews({ limit: 1 });

  const ordersCount = ordersData?.meta.total ?? 0;
  const wishlistCount = wishlistData?.meta.total ?? 0;
  const reviewsCount = reviewsData?.meta.total ?? 0;
  const notificationUnreadCount = useNotificationStore((s) => s.unreadCount);

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const navItems = [
    {
      to: '/profile',
      label: 'My Profile',
      icon: User,
      exact: true,
    },
    {
      to: '/profile/addresses',
      label: 'Shipping Addresses',
      icon: MapPin,
    },
    {
      to: '/orders',
      label: 'My Orders',
      icon: ShoppingCart,
      count: ordersCount,
    },
    {
      to: '/notifications',
      label: 'My Notifications',
      icon: Bell,
      count: notificationUnreadCount,
    },
    {
      to: '/profile/reviews',
      label: 'My Reviews',
      icon: MessageSquare,
      count: reviewsCount,
    },
    {
      to: '/wishlist',
      label: 'My Wishlist',
      icon: Heart,
      count: wishlistCount,
    },
  ];

  return (
    <div className="w-full py-2 animate-in">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar for Desktop / Scrollable Bar for Mobile */}
        <aside className="lg:col-span-1">
          {/* User Profile Summary Panel (Desktop Only) */}
          {profile && (
            <div className="mb-6 hidden items-center gap-3 border-b border-border-default pb-5 lg:flex">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-base font-bold text-text-brand ring-2 ring-brand/10">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">{profile.full_name}</p>
                <p className="truncate text-xs text-text-secondary">{profile.email}</p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {/* Mobile horizontal scrollable tab bar */}
          <nav className="flex gap-2 overflow-x-auto pb-4 max-w-full scrollbar-none lg:flex-col lg:gap-1 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-light font-semibold text-text-brand ring-1 ring-brand/5'
                        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto inline-flex h-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white min-w-5">
                      {item.count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Content Portal */}
        <main className="lg:col-span-3">
          <div className="shop-card bg-surface p-6 min-h-[400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
