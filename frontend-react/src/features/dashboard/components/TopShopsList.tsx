import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { TopShop } from '../types/dashboard.types';

interface Props {
  shops: TopShop[];
}

export function TopShopsList({ shops }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-slate-900">
        Top Shops by Revenue
      </h2>
      {shops.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          No sales data yet
        </p>
      ) : (
        <div className="space-y-3">
          {shops.map((shop, i) => (
            <div
              key={shop.id}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                {i + 1}
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Store className="h-5 w-5 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to={ROUTES.ADMIN_SHOP_DETAIL(shop.id)}
                  className="block truncate text-sm font-medium text-slate-900 hover:text-teal-600"
                >
                  {shop.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {shop.orderCount} orders
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                {formatPrice(shop.revenue)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
