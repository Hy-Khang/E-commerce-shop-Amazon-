import { useEffect, useMemo, useState } from 'react';
import { getImageUrl } from '@/common/utils/format.util';
import type { ProductImage } from '../types/product.types';

interface Props {
  images: ProductImage[];
  productName: string;
  selectedOption1: string | null;
  thumbnailUrl: string | null;
}

export function ImageGallery({ images, productName, selectedOption1, thumbnailUrl }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const displayImages = useMemo(() => {
    const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

    if (selectedOption1) {
      const variantImages = sorted.filter((img) => img.variant_option1 === selectedOption1);
      if (variantImages.length > 0) return variantImages;
    }

    const sharedImages = sorted.filter((img) => img.variant_option1 === null);
    if (sharedImages.length > 0) return sharedImages;

    return [];
  }, [images, selectedOption1]);

  useEffect(() => {
    setActiveIndex(0);
  }, [selectedOption1]);

  const clampedIndex = Math.min(activeIndex, Math.max(displayImages.length - 1, 0));

  if (displayImages.length === 0) {
    if (thumbnailUrl) {
      return (
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <img src={getImageUrl(thumbnailUrl)} alt={productName} className="h-full w-full object-cover" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100 text-gray-400">
        No images
      </div>
    );
  }

  const activeImage = displayImages[clampedIndex];

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        <img
          src={getImageUrl(activeImage.image_url)}
          alt={`${productName} - ${clampedIndex + 1}`}
          className="h-full w-full object-cover"
        />
      </div>
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                idx === clampedIndex ? 'border-brand' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={getImageUrl(img.image_url)}
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
