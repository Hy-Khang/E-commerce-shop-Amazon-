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
      className="flex items-center gap-3 rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
    >
      {shop.logo_url ? (
        <img
          src={shop.logo_url}
          alt={shop.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
          <Store className="h-5 w-5 text-amber-600" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{shop.name}</p>
        <p className="text-xs text-blue-600">Visit Shop</p>
      </div>
    </Link>
  );
}
