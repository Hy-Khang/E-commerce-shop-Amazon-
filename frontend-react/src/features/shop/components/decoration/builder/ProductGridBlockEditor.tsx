import { useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { useSellerProducts } from '@/features/product';
import { useDebounce } from '@/common/hooks/useDebounce';
import { useProductsByIds } from '../../../hooks/useProductsByIds';
import { DECORATION_LIMITS, type ProductGridBlockData } from '../../../types/decoration.types';

interface Props {
  data: ProductGridBlockData;
  onChange: (data: ProductGridBlockData) => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

/**
 * Editor for a curated product grid. Pins up to 12 of the seller's own products
 * (via `useSellerProducts`) — order is the pin order. Portal design language.
 */
export function ProductGridBlockEditor({ data, onChange }: Props) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const ids = data.product_ids ?? [];
  const atLimit = ids.length >= DECORATION_LIMITS.GRID_MAX_IDS;

  const { data: result, isLoading } = useSellerProducts(
    { page: 1, limit: 20, search: debounced || undefined },
    { enabled: true },
  );

  // Hydrate names for pinned ids independently of the current search page, so a
  // chip keeps its name after the search changes or on a fresh page load (the
  // search list only covers 20 products at a time). Same visibility-filtered
  // bulk endpoint the storefront grid uses; cached by ids value (no refetch).
  const { data: pinned } = useProductsByIds(ids);

  const toggle = (id: number) => {
    if (ids.includes(id)) {
      onChange({ ...data, product_ids: ids.filter((x) => x !== id) });
    } else if (!atLimit) {
      onChange({ ...data, product_ids: [...ids, id] });
    }
  };

  // Pinned hydration first, then the current search page overlays it — either
  // source resolves a chip's name; a pin missing from both falls back to `#id`.
  const byId = new Map([
    ...(pinned ?? []).map((p) => [p.id, p] as const),
    ...(result?.data ?? []).map((p) => [p.id, p] as const),
  ]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className={labelClass}>Section title</label>
        <input
          className="admin-input"
          maxLength={80}
          value={data.title ?? ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Columns</label>
        <div className="flex gap-2">
          {([2, 3, 4] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => onChange({ ...data, columns: cols })}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                (data.columns ?? 4) === cols
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className={labelClass}>
          Pinned products ({ids.length}/{DECORATION_LIMITS.GRID_MAX_IDS})
        </span>
        {ids.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ids.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
              >
                {byId.get(id)?.name ?? `#${id}`}
                <button type="button" aria-label="Unpin" onClick={() => toggle(id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Search and select products below to pin them.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="admin-input pl-9"
            placeholder="Search your products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-slate-400">Loading...</p>
          ) : (result?.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No products found.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {result!.data.map((product) => {
                const picked = ids.includes(product.id);
                const disabled = !picked && atLimit;
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(product.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
                    >
                      <img
                        src={product.thumbnail_url ?? ''}
                        alt=""
                        className="h-9 w-9 flex-shrink-0 rounded object-cover ring-1 ring-slate-900/5 dark:ring-white/10"
                      />
                      <span className="flex-1 truncate text-slate-700 dark:text-slate-300">
                        {product.name}
                      </span>
                      {picked && <Check className="h-4 w-4 flex-shrink-0 text-amber-600" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
