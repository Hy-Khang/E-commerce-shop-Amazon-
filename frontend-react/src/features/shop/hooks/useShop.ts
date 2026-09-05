import { useQuery } from '@tanstack/react-query';
import { shopService } from '../services/shop.service';
import { parseDecorationConfig } from '../types/decoration.types';

export const shopKeys = {
  all: ['shops'] as const,
  detail: (slug: string) => ['shops', 'detail', slug] as const,
  products: (slug: string, params: Record<string, unknown>) => ['shops', 'products', slug, params] as const,
};

export function useShop(slug: string) {
  return useQuery({
    queryKey: shopKeys.detail(slug),
    queryFn: () => shopService.getBySlug(slug),
    // Guard-parse decoration_config so a malformed/legacy envelope degrades to
    // null (default layout) rather than reaching the renderer.
    select: (res) => ({
      ...res.data.data,
      decoration_config: parseDecorationConfig(res.data.data.decoration_config),
    }),
    enabled: !!slug,
  });
}
