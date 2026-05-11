import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { cartService } from '../services/cart.service';
import { useCartStore } from '../stores/cart.store';

export const cartKeys = {
  current: () => ['cart'] as const,
};

export function useCart() {
  const setItemCount = useCartStore((s) => s.setItemCount);

  const query = useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => cartService.getCart().then((res) => res.data.data),
    staleTime: 0,
  });

  useEffect(() => {
    if (query.data) {
      const count = query.data.items.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(count);
    }
  }, [query.data, setItemCount]);

  return query;
}
