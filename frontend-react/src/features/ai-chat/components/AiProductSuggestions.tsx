import { ProductCard } from '@/features/product';
import type { ProductListItem } from '@/features/product';

interface Props {
  products: ProductListItem[];
  onNavigate?: () => void;
}

/** Compact 2-col grid of suggested products inside an assistant bubble. */
export function AiProductSuggestions({ products, onNavigate }: Props) {
  if (!products.length) return null;

  return (
    <div
      className="mt-2 grid grid-cols-2 gap-2"
      onClickCapture={onNavigate}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
