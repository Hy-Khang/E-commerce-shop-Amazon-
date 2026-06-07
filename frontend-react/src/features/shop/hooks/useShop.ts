import { useQuery } from '@tanstack/react-query';
import { shopService } from '../services/shop.service';

export const shopKeys = {
  all: ['shops'] as const,
  detail: (slug: string) => ['shops', 'detail', slug] as const,
  products: (slug: string, params: Record<string, unknown>) => ['shops', 'products', slug, params] as const,
};

export function useShop(slug: string) {
  return useQuery({
    queryKey: shopKeys.detail(slug),
    queryFn: () => shopService.getBySlug(slug),
    select: (res) => res.data.data,
    enabled: !!slug,
  });
}
