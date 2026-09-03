import { formatPrice } from '@/common/utils/format.util';
import { getPriceRange, hasAnyStock, getUniqueOptionValues, type ProductListItem } from '@/features/product';
import { RatingStars } from './RatingStars';

/**
 * Row definitions for the comparison table. `signature` is a comparable string per
 * product — a row is highlighted when its products don't all share the same signature
 * (the "difference" cue from the module spec).
 */
export interface CompareRow {
  label: string;
  render: (p: ProductListItem) => React.ReactNode;
  signature: (p: ProductListItem) => string;
}

function priceLabel(product: ProductListItem): string {
  const range = getPriceRange(product.variants);
  if (!range) return '—';
  return range.min === range.max
    ? formatPrice(range.min)
    : `${formatPrice(range.min)} — ${formatPrice(range.max)}`;
}

function optionCell(product: ProductListItem, optionKey: 'option1' | 'option2'): React.ReactNode {
  const label = optionKey === 'option1' ? product.option1_label : product.option2_label;
  if (!label) return <span className="text-text-muted">—</span>;
  const values = getUniqueOptionValues(product.variants, optionKey);
  return (
    <div>
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {values.map((v) => (
          <span key={v} className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-secondary">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

export const COMPARISON_ROWS: CompareRow[] = [
  {
    label: 'Giá',
    render: (p) => <span className="font-bold text-text-price">{priceLabel(p)}</span>,
    signature: priceLabel,
  },
  {
    label: 'Đánh giá',
    render: (p) => <RatingStars rating={p.avgRating ?? 0} count={p.reviewCount ?? 0} />,
    signature: (p) => String(p.avgRating ?? 0),
  },
  { label: 'Danh mục', render: (p) => p.category?.name ?? '—', signature: (p) => p.category?.name ?? '' },
  { label: 'Cửa hàng', render: (p) => p.shop?.name ?? '—', signature: (p) => p.shop?.name ?? '' },
  {
    label: 'Phân loại 1',
    render: (p) => optionCell(p, 'option1'),
    signature: (p) => getUniqueOptionValues(p.variants, 'option1').join(','),
  },
  {
    label: 'Phân loại 2',
    render: (p) => optionCell(p, 'option2'),
    signature: (p) => getUniqueOptionValues(p.variants, 'option2').join(','),
  },
  {
    label: 'Tình trạng',
    render: (p) =>
      hasAnyStock(p.variants) ? (
        <span className="text-sm font-medium text-emerald-600">Còn hàng</span>
      ) : (
        <span className="text-sm font-medium text-error-600">Hết hàng</span>
      ),
    signature: (p) => (hasAnyStock(p.variants) ? '1' : '0'),
  },
];
