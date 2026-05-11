// Hooks
export { productKeys, useProducts } from './hooks/useProducts';
export { useProduct } from './hooks/useProduct';
export { categoryKeys, useCategories, useCategoryBySlug } from './hooks/useCategories';
export { usePrefetchProduct } from './hooks/usePrefetchProduct';
export { adminProductKeys, useAdminProducts } from './hooks/useAdminProducts';
export { useAdminProduct } from './hooks/useAdminProduct';
export { useCreateProduct } from './hooks/useCreateProduct';
export { useUpdateProduct } from './hooks/useUpdateProduct';
export { useToggleProductActive } from './hooks/useToggleProductActive';
export { useAddVariant, useUpdateVariant, useDeleteVariant } from './hooks/useAdminVariants';
export { useAddImage, useUpdateImage, useDeleteImage } from './hooks/useAdminImages';
export {
  adminCategoryKeys,
  useAdminCategories,
  useAdminCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './hooks/useAdminCategories';

// Components
export { ProductCard } from './components/ProductCard';
export { VariantSelector } from './components/VariantSelector';
export { ImageGallery } from './components/ImageGallery';
export { CategorySidebar } from './components/CategorySidebar';
export { ProductCardSkeleton } from './components/ProductCardSkeleton';
export { ProductDetailSkeleton } from './components/ProductDetailSkeleton';

// Utils
export {
  getEffectivePrice,
  getPriceRange,
  isInStock,
  hasAnyStock,
  getUniqueColors,
  getUniqueSizes,
  generateSlug,
  getLowestPriceVariant,
} from './utils/product.util';

// Types
export type {
  Product,
  ProductListItem,
  ProductVariant,
  ProductImage,
  Category,
  AdminCategory,
  AdminProductDetail,
  ProductListParams,
  AdminProductListParams,
  AdminCategoryListParams,
  CreateProductRequest,
  UpdateProductRequest,
  CreateVariantRequest,
  UpdateVariantRequest,
  CreateImageRequest,
  UpdateImageRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateProductFormData,
  CreateVariantFormData,
  CreateCategoryFormData,
} from './types/product.types';
export { createProductSchema, createVariantSchema, createCategorySchema } from './types/product.types';
