import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductListItem } from '@/features/product';
import { useCompare } from '../hooks/useCompare';
import { MAX_COMPARE } from '../stores/compare.store';

interface Props {
  product: ProductListItem;
}

/**
 * "So sánh" toggle overlaid on a ProductCard. Adds/removes the product from the
 * comparison set. Removal is always allowed; adding a different-category product
 * (or a 5th) is refused with an explanatory toast. Lives inside the card's <Link>,
 * so it stops propagation/navigation on click.
 */
export function CompareToggleButton({ product }: Props) {
  const { isInCompare, canAdd, add, remove } = useCompare();
  const active = isInCompare(product.id);
  const blocked = !active && !canAdd(product.category_id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (active) {
      remove(product.id);
      toast.info('Removed from comparison');
      return;
    }

    const result = add(product.id, product.category_id);
    if (result === 'added') {
      toast.success('Added to comparison');
    } else if (result === 'full') {
      toast.error(`You can compare up to ${MAX_COMPARE} products`);
    } else {
      toast.error('You can only compare products in the same category');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Remove from comparison' : 'Compare'}
      aria-pressed={active}
      title={
        active
          ? 'Remove from comparison'
          : blocked
            ? 'Only products in the same category can be compared (up to 4)'
            : 'Add to comparison'
      }
      className={`rounded-full p-1.5 shadow-sm ring-1 transition-colors ${
        active
          ? 'bg-brand text-white ring-brand'
          : blocked
            ? 'bg-white/90 text-text-muted ring-border-default'
            : 'bg-white/90 text-text-secondary ring-border-default hover:bg-brand-light hover:text-text-brand'
      }`}
    >
      <Scale className="h-4 w-4" />
    </button>
  );
}
