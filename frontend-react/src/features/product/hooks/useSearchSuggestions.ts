import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/common/hooks/useDebounce';
import { productService } from '../services/product.service';

export const searchSuggestionKeys = {
  suggestions: (q: string) => ['search', 'suggestions', q] as const,
};

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: searchSuggestionKeys.suggestions(debouncedQuery),
    queryFn: () => productService.getSuggestions(debouncedQuery, 5),
    select: (res) => res.data.data,
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });
}
