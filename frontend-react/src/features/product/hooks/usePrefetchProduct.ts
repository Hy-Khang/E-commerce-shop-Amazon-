import { useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { productKeys } from './useProducts';

export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(slug),
      queryFn: () => productService.getBySlug(slug),
      staleTime: 5 * 60 * 1000,
    });
  };
}
