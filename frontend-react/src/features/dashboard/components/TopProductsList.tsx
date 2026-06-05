import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { formatPrice } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import type { TopProduct } from '../types/dashboard.types';

interface Props {
  products: TopProduct[];
}

export function TopProductsList({ products }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 font-jakarta text-lg font-bold text-gray-900">
        Top Products
      </h2>
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No sales data yet</p>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {i + 1}
              </span>
              {product.thumbnailUrl ? (
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
                  className="block truncate text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-gray-500">
                  {product.totalOrdered} sold
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                {formatPrice(product.totalRevenue)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
