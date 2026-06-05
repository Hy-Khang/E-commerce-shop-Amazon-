import { useQuery } from '@tanstack/react-query';
import { sellerProductService } from '../services/seller-product.service';
import { sellerProductKeys } from './useSellerProducts';

export function useSellerProduct(id: number) {
  return useQuery({
    queryKey: sellerProductKeys.detail(id),
    queryFn: () => sellerProductService.getById(id),
    select: (res) => res.data.data,
    enabled: id > 0,
  });
}
