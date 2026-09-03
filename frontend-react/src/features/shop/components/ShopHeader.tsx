import { Store, Package, Star, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { ChatWithShopButton } from '@/features/chat';
import type { ShopProfile } from '../types/shop.types';

interface Props {
  shop: ShopProfile;
}

export function ShopHeader({ shop }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnShop = currentUserId != null && currentUserId === shop.user_id;

  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-elevated shadow-sm">
      {shop.banner_url ? (
        <div className="h-40 w-full bg-surface-hover sm:h-52">
          <img
            src={shop.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-primary-600 to-primary-800 sm:h-52" />
      )}

      <div className="-mt-8 px-6 pb-6">
        <div className="flex items-end gap-4">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-20 w-20 flex-shrink-0 rounded-full border-4 border-surface bg-surface object-cover shadow"
            />
          ) : (
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 border-surface bg-brand-light shadow">
              <Store className="h-8 w-8 text-text-brand" />
            </div>
          )}
          {/* Name + action share a centered row that sits fully below the banner,
              so the button never crosses the banner seam. */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-1">
            <h1 className="min-w-0 truncate text-xl font-bold text-text-primary">{shop.name}</h1>
            {!isOwnShop && (
              <div className="flex-shrink-0">
                <ChatWithShopButton shopId={shop.id} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4 text-text-muted" />
            <span>{shop.product_count ?? 0} Products</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>{(shop.average_rating ?? 0).toFixed(1)} Rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4 text-text-muted" />
            <span>{shop.total_sales ?? 0} Sold</span>
          </div>
        </div>

        {shop.description && (
          <p className="mt-3 text-sm text-text-secondary leading-relaxed">{shop.description}</p>
        )}
      </div>
    </div>
  );
}
