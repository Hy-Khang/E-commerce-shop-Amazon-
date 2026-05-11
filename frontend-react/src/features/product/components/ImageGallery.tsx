import { useState } from 'react';
import type { ProductImage } from '../types/product.types';

interface Props {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: Props) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = sorted[activeIndex];

  if (sorted.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img
          src={activeImage.image_url}
          alt={`${productName} - ${activeIndex + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                idx === activeIndex ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
