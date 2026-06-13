import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';

export const homepageKeys = {
  all: ['homepage'] as const,
  data: () => ['homepage', 'data'] as const,
};

export function useHomepage() {
  return useQuery({
    queryKey: homepageKeys.data(),
    queryFn: () => productService.getHomepage(),
    select: (res) => res.data.data,
    staleTime: 5 * 60 * 1000,
  });
}
