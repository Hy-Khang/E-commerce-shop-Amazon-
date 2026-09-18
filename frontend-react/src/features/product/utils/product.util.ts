import type { ProductVariant, ProductListItem, Category } from '../types/product.types';

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

export function getUniqueOptionValues(
  variants: ProductVariant[],
  optionKey: 'option1' | 'option2',
): string[] {
  return [...new Set(variants.map((v) => v[optionKey]).filter(Boolean))] as string[];
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

/**
 * Reorders a list of sibling categories so that the catch-all "Khác" / "Other"
 * category always sinks to the bottom, while every other category keeps its
 * original relative order (stable). Case/accent-insensitive name match.
 */
export function sortCategoriesOtherLast<T extends { name: string }>(categories: T[]): T[] {
  const isOther = (name: string) => {
    const normalized = name.trim().toLowerCase();
    return normalized === 'khác' || normalized === 'khac' || normalized === 'other';
  };
  return [...categories].sort((a, b) => {
    const aOther = isOther(a.name);
    const bOther = isOther(b.name);
    if (aOther === bOther) return 0;
    return aOther ? 1 : -1;
  });
}

export interface FlatCategoryOption {
  id: number;
  label: string;
}

/** Flattens a category tree into indented options for a `<select>` dropdown. */
export function flattenCategoryTree(
  categories: Category[],
  depth = 0,
): FlatCategoryOption[] {
  const result: FlatCategoryOption[] = [];
  for (const cat of sortCategoriesOtherLast(categories)) {
    result.push({ id: cat.id, label: `${'— '.repeat(depth)}${cat.name}` });
    if (cat.children?.length) {
      result.push(...flattenCategoryTree(cat.children, depth + 1));
    }
  }
  return result;
}
