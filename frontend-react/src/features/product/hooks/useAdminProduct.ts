import { useQuery } from '@tanstack/react-query';
import { adminProductService } from '../services/admin-product.service';
import { adminProductKeys } from './useAdminProducts';

export function useAdminProduct(id: number) {
  return useQuery({
    queryKey: adminProductKeys.detail(id),
    queryFn: () => adminProductService.getById(id),
    select: (res) => res.data.data,
    enabled: !!id,
  });
}
