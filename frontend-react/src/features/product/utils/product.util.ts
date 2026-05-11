import type { ProductVariant, ProductListItem } from '../types/product.types';

export function getEffectivePrice(variant: ProductVariant): number {
  return variant.sale_price ?? variant.price;
}

export function getPriceRange(variants: ProductVariant[]): { min: number; max: number } | null {
  if (variants.length === 0) return null;
  const prices = variants.map(getEffectivePrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function isInStock(variant: ProductVariant): boolean {
  return variant.stock_quantity > 0;
}

export function hasAnyStock(variants: ProductVariant[]): boolean {
  return variants.some(isInStock);
}

export function getUniqueColors(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
}

export function getUniqueSizes(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getLowestPriceVariant(product: ProductListItem): ProductVariant | undefined {
  if (product.variants.length === 0) return undefined;
  return product.variants.reduce((low, v) =>
    getEffectivePrice(v) < getEffectivePrice(low) ? v : low,
  );
}
