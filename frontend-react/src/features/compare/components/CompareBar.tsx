import { useNavigate } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { getImageUrl } from '@/common/utils/format.util';
import { useCompare } from '../hooks/useCompare';
import { MAX_COMPARE } from '../stores/compare.store';

/**
 * Floating comparison bar, mounted once in MainLayout (mirrors AiChatWidget).
 * Hidden until at least one product is selected. Sits above the header (z-40)
 * but below drawers (z-60) per DESIGN.md §14. The right padding keeps the action
 * buttons clear of the AI chat FAB (also fixed bottom-right, same z-50).
 */
export function CompareBar() {
  const navigate = useNavigate();
  const { items, products, count, remove, clear } = useCompare();

  if (count === 0) return null;

  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border-default bg-surface/95 pr-20 shadow-lg backdrop-blur sm:pr-24">
      <div className="shop-container flex items-center gap-4 py-3">
        <div className="hidden items-center gap-2 text-sm font-semibold text-text-primary sm:flex">
          <Scale className="h-4 w-4 text-text-brand" />
          Compare
        </div>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => {
            const product = byId.get(item.product_id);
            return (
              <div
                key={item.product_id}
                className="group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border-default bg-surface-hover"
              >
                {product?.thumbnail_url ? (
                  <img
                    src={getImageUrl(product.thumbnail_url)}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-neutral-200" />
                )}
                <button
                  type="button"
                  onClick={() => remove(item.product_id)}
                  aria-label="Remove from comparison"
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
          {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-14 w-14 flex-shrink-0 rounded-lg border border-dashed border-border-strong"
            />
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.COMPARE)}
            disabled={count < 2}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Compare ({count})
          </button>
        </div>
      </div>
    </div>
  );
}
