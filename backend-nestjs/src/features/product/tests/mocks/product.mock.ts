import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductImage } from '../../entities/product-image.entity';

export const mockCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: 'Electronics',
  slug: 'electronics',
  parent_id: null as any,
  parent: null as any,
  children: [],
  products: [],
  ...overrides,
});

export const mockCategoryWithChildren = (
  overrides: Partial<Category> = {},
): Category => ({
  ...mockCategory(),
  children: [
    mockCategory({ id: 10, name: 'Phones', slug: 'phones', parent_id: 1 }),
    mockCategory({ id: 11, name: 'Laptops', slug: 'laptops', parent_id: 1 }),
  ],
  ...overrides,
});

export const mockCategoryWithProductCount = (
  overrides: Partial<Category & { productCount: number }> = {},
): Category & { productCount: number } => ({
  ...mockCategory(),
  productCount: 5,
  ...overrides,
});

export const mockProductVariant = (
  overrides: Partial<ProductVariant> = {},
): ProductVariant => ({
  id: 1,
  sku: 'ELEC-BLK-M',
  color: 'Black',
  size: 'M',
  price: 250000,
  sale_price: null as any,
  stock_quantity: 100,
  product_id: 1,
  product: null as any,
  ...overrides,
});

export const mockProductImage = (
  overrides: Partial<ProductImage> = {},
): ProductImage => ({
  id: 1,
  image_url: 'https://cdn.example.com/img/product-1.jpg',
  sort_order: 0,
  product_id: 1,
  product: null as any,
  ...overrides,
});

export const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Wireless Headphones',
  slug: 'wireless-headphones',
  description: 'High quality wireless headphones',
  thumbnail_url: 'https://cdn.example.com/img/headphones.jpg',
  is_active: true,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  category_id: 1,
  category: mockCategory(),
  variants: [mockProductVariant()],
  images: [mockProductImage()],
  ...overrides,
});

export const mockProductWithReviewStats = (
  overrides: Partial<Product & { reviewCount: number; avgRating: number }> = {},
): Product & { reviewCount: number; avgRating: number } => ({
  ...mockProduct(),
  reviewCount: 10,
  avgRating: 4.5,
  ...overrides,
});

export const mockPaginatedProducts = (products: Product[] = [mockProduct()]) => ({
  data: products,
  meta: { page: 1, limit: 20, total: products.length, totalPages: 1 },
});

export const mockPaginatedCategories = (categories: Category[] = [mockCategory()]) => ({
  data: categories,
  meta: { page: 1, limit: 20, total: categories.length, totalPages: 1 },
});
