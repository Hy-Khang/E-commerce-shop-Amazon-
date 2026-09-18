import { Scale } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('compare');
  const { isInCompare, canAdd, add, remove } = useCompare();
  const active = isInCompare(product.id);
  const blocked = !active && !canAdd(product.category_id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (active) {
      remove(product.id);
      toast.info(t('toggle.toast.removed', { ns: 'toast' })); // Use compare ns for now, wait we added it to toast
      return;
    }

    const result = add(product.id, product.category_id);
    if (result === 'added') {
      toast.success(t('toggle.toast.added', { ns: 'toast' })); // Use toast NS since we added it to toast.json
    } else if (result === 'full') {
      toast.error(t('toggle.toast.full', { max: MAX_COMPARE, ns: 'toast' }));
    } else {
      toast.error(t('toggle.toast.category', { ns: 'toast' }));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? t('toggle.remove') : t('toggle.compare')}
      aria-pressed={active}
      title={
        active
          ? t('toggle.remove')
          : blocked
            ? t('toggle.blocked')
            : t('toggle.add')
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
