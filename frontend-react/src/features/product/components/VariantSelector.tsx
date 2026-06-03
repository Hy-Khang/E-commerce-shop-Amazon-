import { useMemo } from 'react';
import { getUniqueOptionValues, isInStock } from '../utils/product.util';
import type { ProductVariant } from '../types/product.types';

interface Props {
  variants: ProductVariant[];
  selectedVariantId: number | null;
  onSelect: (variant: ProductVariant) => void;
  option1Label: string | null;
  option2Label: string | null;
}

export function VariantSelector({ variants, selectedVariantId, onSelect, option1Label, option2Label }: Props) {
  const option1Values = useMemo(() => getUniqueOptionValues(variants, 'option1'), [variants]);
  const option2Values = useMemo(() => getUniqueOptionValues(variants, 'option2'), [variants]);
  const selected = variants.find((v) => v.id === selectedVariantId);

  function findVariant(opt1: string | null, opt2: string | null): ProductVariant | undefined {
    return variants.find(
      (v) => (opt1 === null || v.option1 === opt1) && (opt2 === null || v.option2 === opt2),
    );
  }

  function handleOption1Select(value: string) {
    const match = findVariant(value, selected?.option2 ?? null) ?? variants.find((v) => v.option1 === value);
    if (match) onSelect(match);
  }

  function handleOption2Select(value: string) {
    const match = findVariant(selected?.option1 ?? null, value) ?? variants.find((v) => v.option2 === value);
    if (match) onSelect(match);
  }

  return (
    <div className="space-y-4">
      {option1Label && option1Values.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">
            {option1Label}: {selected?.option1 ?? '—'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {option1Values.map((value) => {
              const variant = variants.find((v) => v.option1 === value);
              const outOfStock = variant ? !isInStock(variant) : true;
              return (
                <button
                  key={value}
                  onClick={() => handleOption1Select(value)}
                  disabled={outOfStock}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selected?.option1 === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {option2Label && option2Values.length > 0 && (
        <div>
          <span className="text-sm font-medium text-gray-700">
            {option2Label}: {selected?.option2 ?? '—'}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {option2Values.map((value) => {
              const variant = variants.find((v) => v.option2 === value && (selected?.option1 === null || v.option1 === selected?.option1));
              const outOfStock = variant ? !isInStock(variant) : true;
              return (
                <button
                  key={value}
                  onClick={() => handleOption2Select(value)}
                  disabled={outOfStock}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    selected?.option2 === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
