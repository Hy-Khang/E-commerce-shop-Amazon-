import { ShoppingCart, Sparkles } from 'lucide-react';
import { ProductCard } from '@/features/product';
import type { ProductListItem } from '@/features/product';
import { useAiChatStore, type AiPanelSize } from '../stores/ai-chat.store';

interface Props {
  products: ProductListItem[];
  onNavigate?: () => void;
  /** Tapping a card's "Add to cart" hands the product to the agent (as a new
   *  message), which then asks colour/size via chips before adding — turning the
   *  discover → pick → add flow into taps. Omitted → cards are display-only. */
  onPickSuggestion?: (text: string) => void;
}

// Denser than the storefront grid — suggestion thumbnails read compact inside the
// chat bubble. Columns widen with the panel size (from `sm:` up; mobile stays 3).
const GRID_CLASS: Record<AiPanelSize, string> = {
  normal: 'grid grid-cols-3 gap-2',
  large: 'grid grid-cols-3 gap-2 sm:grid-cols-4',
  full: 'grid grid-cols-3 gap-2 sm:grid-cols-5',
};

/**
 * Compact grid of suggested products inside an assistant bubble, headed by a
 * micro-label so the cards read as AI picks (not ads). Columns scale with the
 * panel size: 3 (normal) → 4 (large) → 5 (full). Each card carries an "Add to
 * cart" button that hands the product to the agent for a tap-driven variant pick.
 */
export function AiProductSuggestions({ products, onNavigate, onPickSuggestion }: Props) {
  const size = useAiChatStore((s) => s.size);

  if (!products.length) return null;

  return (
    <div className="mt-2">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        <Sparkles className="h-3 w-3" />
        {products.length} suggested products
      </p>
      {/* items-stretch (grid default) makes every cell as tall as the tallest in
          its row; the card grows (flex-1 + h-full) so its bottom — and the button
          under it — line up across the row even when a price wraps to two lines. */}
      <div className={GRID_CLASS[size]}>
        {products.map((product) => (
          <div key={product.id} className="flex h-full flex-col gap-1.5">
            {/* Navigate-capture wraps only the card, so the action button below
                (a sibling) isn't swallowed by it and can start the agent flow. */}
            <div onClickCapture={onNavigate} className="flex-1">
              <ProductCard product={product} compact className="h-full" />
            </div>
            {onPickSuggestion && (
              <button
                type="button"
                onClick={() => onPickSuggestion(`Add "${product.name}" to my cart`)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-border-brand px-1.5 py-1 text-[10px] font-semibold text-text-brand transition-colors hover:bg-brand-light"
              >
                <ShoppingCart className="h-3 w-3" /> Add to cart
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
