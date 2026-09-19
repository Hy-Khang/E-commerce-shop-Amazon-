import { BEST_SELLERS_LIMITS, type BestSellersBlockData } from '../../../types/decoration.types';

interface Props {
  data: BestSellersBlockData;
  onChange: (data: BestSellersBlockData) => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

const chipClass = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm transition-colors ${
    active
      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
  }`;

/**
 * Editor for the auto best-sellers block: a title, how many products to show,
 * and the column count. No product picker — the block fills itself from the
 * shop's top sellers. Portal design language (slate/amber + dark).
 */
export function BestSellersBlockEditor({ data, onChange }: Props) {
  const limit = data.limit ?? 4;
  const columns = data.columns ?? 4;

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
        <span className={labelClass}>Number of products</span>
        <div className="flex gap-2">
          {BEST_SELLERS_LIMITS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange({ ...data, limit: n })}
              className={chipClass(limit === n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className={labelClass}>Columns</span>
        <div className="flex gap-2">
          {([2, 3, 4] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => onChange({ ...data, columns: cols })}
              className={chipClass(columns === cols)}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Products are picked automatically from your shop's best sellers — no manual selection.
      </p>
    </div>
  );
}
