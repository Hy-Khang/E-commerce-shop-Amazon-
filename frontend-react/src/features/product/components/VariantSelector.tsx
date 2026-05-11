import { useMemo } from 'react';
import { getUniqueColors, getUniqueSizes, isInStock } from '../utils/product.util';
import type { ProductVariant } from '../types/product.types';

interface Props {
  variants: ProductVariant[];
  selectedVariantId: number | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: Props) {
  const colors = useMemo(() => getUniqueColors(variants), [variants]);
  const sizes = useMemo(() => getUniqueSizes(variants), [variants]);
  const selected = variants.find((v) => v.id === selectedVariantId);

  function findVariant(color: string | null, size: string | null): ProductVariant | undefined {
    return variants.find(
      (v) => (color === null || v.color === color) && (size === null || v.size === size),
    );
  }

  function handleColorSelect(color: string) {
    const match = findVariant(color, selected?.size ?? null) ?? variants.find((v) => v.color === color);
    if (match) onSelect(match);
  }

  function handleSizeSelect(size: string) {
    const match = findVariant(selected?.color ?? null, size) ?? variants.find((v) => v.size === size);
    if (match) onSelect(match);
  }

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">
            Color: {selected?.color ?? '—'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              const outOfStock = variant ? !isInStock(variant) : true;
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={outOfStock}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selected?.color === color
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">
            Size: {selected?.size ?? '—'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size && (selected?.color === null || v.color === selected?.color));
              const outOfStock = variant ? !isInStock(variant) : true;
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={outOfStock}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selected?.size === size
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
