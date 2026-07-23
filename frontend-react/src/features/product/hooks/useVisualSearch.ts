import { useMutation } from '@tanstack/react-query';
import { productService } from '../services/product.service';

export function useVisualSearch() {
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await productService.searchByImage(file);
      return res.data.data;
    },
  });
}
