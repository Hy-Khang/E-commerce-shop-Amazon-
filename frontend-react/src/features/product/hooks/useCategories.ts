import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';

export const categoryKeys = {
  all: ['categories'] as const,
  tree: () => ['categories', 'tree'] as const,
  detail: (slug: string) => ['categories', 'detail', slug] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: () => productService.getCategories(),
    select: (res) => res.data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => productService.getCategoryBySlug(slug),
    select: (res) => res.data.data,
    enabled: !!slug,
  });
}
