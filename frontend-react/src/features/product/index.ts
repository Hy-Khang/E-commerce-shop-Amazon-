// Hooks
export { productKeys, useProducts } from './hooks/useProducts';
export { useProduct } from './hooks/useProduct';
export { categoryKeys, useCategories, useCategoryBySlug } from './hooks/useCategories';
export { usePrefetchProduct } from './hooks/usePrefetchProduct';
export { homepageKeys, useHomepage } from './hooks/useHomepage';
export { adminProductKeys, useAdminProducts } from './hooks/useAdminProducts';
export { sellerProductKeys, useSellerProducts } from './hooks/useSellerProducts';
export { useAdminProduct } from './hooks/useAdminProduct';
export { useCreateProduct } from './hooks/useCreateProduct';
export { useUpdateProduct } from './hooks/useUpdateProduct';
export { useToggleProductActive } from './hooks/useToggleProductActive';
export { useAddVariant, useUpdateVariant, useDeleteVariant } from './hooks/useAdminVariants';
export { useAddImage, useUpdateImage, useDeleteImage } from './hooks/useAdminImages';
export { useUploadImage } from './hooks/useUploadImage';
export { searchSuggestionKeys, useSearchSuggestions } from './hooks/useSearchSuggestions';
export { useVisualSearch } from './hooks/useVisualSearch';
export {
  adminCategoryKeys,
  useAdminCategories,
  useAdminCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './hooks/useAdminCategories';

// Components
export { CategoryForm } from './components/CategoryForm';
export { ProductFilters } from './components/ProductFilters';
export { ProductCard } from './components/ProductCard';
export { HomepageProductCard } from './components/HomepageProductCard';
export { SaleProductCard } from './components/SaleProductCard';
export { VariantSelector } from './components/VariantSelector';
export { ImageGallery } from './components/ImageGallery';
export { ImageUpload } from './components/ImageUpload';
export { CategorySidebar } from './components/CategorySidebar';
export { SearchBarWithSuggestions } from './components/SearchBarWithSuggestions';
export { FilterSidebar } from './components/FilterSidebar';
export { SortDropdown } from './components/SortDropdown';
export { VisualSearchModal } from './components/VisualSearchModal';
export { ProductCardSkeleton } from './components/ProductCardSkeleton';
export { ProductDetailSkeleton } from './components/ProductDetailSkeleton';
export { ShopProductsCarousel } from './components/ShopProductsCarousel';
export { RelatedProducts } from './components/RelatedProducts';
export { SpecialOffersSection } from './components/SpecialOffersSection';
export { FeaturedCategoriesSection } from './components/FeaturedCategoriesSection';
export { PromotionalBanner } from './components/PromotionalBanner';
export { BestSellersSection } from './components/BestSellersSection';
export { TrendingSection } from './components/TrendingSection';
export { DiscoverMoreSection } from './components/DiscoverMoreSection';

// Constants
export { HOMEPAGE_PROMO } from './constants/homepage.constants';

// Utils
export {
  getEffectivePrice,
  getPriceRange,
  isInStock,
  hasAnyStock,
  getUniqueOptionValues,
  generateSlug,
  getLowestPriceVariant,
  flattenCategoryTree,
} from './utils/product.util';
export type { FlatCategoryOption } from './utils/product.util';

// Types
export type {
  Product,
  ProductListItem,
  ProductVariant,
  ProductImage,
  Category,
  AdminCategory,
  AdminProductDetail,
  HomepageProductItem,
  TrendingProductItem,
  HomepageData,
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
  SearchSuggestions,
  VisualSearchTags,
  VisualSearchResult,
} from './types/product.types';
export { createProductSchema, createVariantSchema, createCategorySchema } from './types/product.types';
