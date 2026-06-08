import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import type { ShopSummary } from '@/features/product/types/product.types';

interface Props {
  shop: ShopSummary;
}

export function ShopInfoCard({ shop }: Props) {
  return (
    <Link
      to={ROUTES.SHOP_PROFILE(shop.slug)}
      className="shop-card flex items-center gap-4 p-5 transition-all hover:border-border-strong hover:bg-surface-hover hover:shadow-sm"
    >
      {shop.logo_url ? (
        <img
          src={shop.logo_url}
          alt={shop.name}
          className="h-12 w-12 rounded-full object-cover border border-border-default shadow-xs"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 border border-primary-100">
          <Store className="h-6 w-6 text-primary-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">{shop.name}</p>
        <p className="mt-0.5 text-xs font-semibold text-text-brand hover:text-primary-700 transition-colors">Visit Shop</p>
      </div>
    </Link>
  );
}
