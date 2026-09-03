import { Sparkles } from 'lucide-react';
import { ProductCard } from '@/features/product';
import type { ProductListItem } from '@/features/product';
import { useAiChatStore, type AiPanelSize } from '../stores/ai-chat.store';

interface Props {
  products: ProductListItem[];
  onNavigate?: () => void;
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
 * panel size: 2 (normal) → 3 (large) → 4 (full).
 */
export function AiProductSuggestions({ products, onNavigate }: Props) {
  const size = useAiChatStore((s) => s.size);

  if (!products.length) return null;

  return (
    <div className="mt-2">
      <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
        <Sparkles className="h-3 w-3" />
        {products.length} suggested products
      </p>
      <div className={GRID_CLASS[size]} onClickCapture={onNavigate}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>
    </div>
  );
}
