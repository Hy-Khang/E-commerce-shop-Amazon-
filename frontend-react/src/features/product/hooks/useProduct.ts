import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { productKeys } from './useProducts';

export function useProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.detail(slug),
    queryFn: () => productService.getBySlug(slug),
    select: (res) => res.data.data,
    enabled: !!slug,
  });
}
