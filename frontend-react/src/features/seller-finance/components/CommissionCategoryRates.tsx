import { useMemo, useState } from 'react';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { useCategories, CategoryCascader, type Category } from '@/features/product';
import {
  useCommissionCategoryRates,
  useUpsertCommissionCategoryRate,
  useDeleteCommissionCategoryRate,
} from '../hooks/useCommissionSettings';
import { PercentField } from './PercentField';

/** Per-category commission override editor (used when mode = 'category'). */
export function CommissionCategoryRates() {
  const { data: rates } = useCommissionCategoryRates();
  const { data: categories } = useCategories();
  const upsert = useUpsertCommissionCategoryRate();
  const remove = useDeleteCommissionCategoryRate();

  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [rate, setRate] = useState<number | undefined>(undefined);

  const nameById = useMemo(() => {
    const map = new Map<number, string>();
    const walk = (list: Category[]) => {
      for (const c of list) {
        map.set(c.id, c.name);
        if (c.children?.length) walk(c.children);
      }
    };
    walk(categories ?? []);
    return map;
  }, [categories]);

  const handleAdd = () => {
    if (!categoryId || rate === undefined || Number.isNaN(rate)) return;
    upsert.mutate(
      { categoryId, rate_percent: rate },
      {
        onSuccess: () => {
          setCategoryId(undefined);
          setRate(undefined);
        },
      },
    );
  };

  return (
    <div className="admin-card p-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Per-category commission
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Categories without a specific rate fall back to the general commission rate.
      </p>

      <div className="mt-4 space-y-2">
        {(rates ?? []).length === 0 && (
          <p className="py-2 text-sm text-slate-400 dark:text-slate-500">
            No category rates yet.
          </p>
        )}
        {(rates ?? []).map((r) => (
          <div
            key={r.category_id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
          >
            <span className="text-sm text-slate-900 dark:text-slate-100">
              {nameById.get(r.category_id) ?? `Category #${r.category_id}`}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {Number(r.rate_percent).toFixed(2)}%
              </span>
              <button
                onClick={() => remove.mutate(r.category_id)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="min-w-[200px] flex-1">
          <CategoryCascader
            categories={categories ?? []}
            value={categoryId}
            onChange={setCategoryId}
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Rate (%)
          </label>
          <div className="mt-1">
            <PercentField value={rate} onChange={setRate} />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={upsert.isPending || !categoryId || rate === undefined}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
        >
          {upsert.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add
        </button>
      </div>
    </div>
  );
}
