import type { ProductListItem } from '@/features/product';

/**
 * Sample data for the builder's storefront preview ONLY. Blocks render these
 * when `context.preview === true` and they have nothing real to show, so an
 * unconfigured block (empty grid, un-located best-sellers) is still visualizable.
 * Never used on the public storefront — the renderer never sets `preview` there,
 * so shoppers never see fake products.
 *
 * Ids are negative to guarantee they never collide with real product ids.
 */
export const PLACEHOLDER_HERO_IMAGE =
  '/images/products/ao-khoac-non-branded-04-den-1174884707.jpg';

const SAMPLE_IMAGES = [
  '/images/products/ao-thun-seventy-seven-10-den-1174883597.jpg',
  '/images/products/ao-so-mi-non-branded-33-den-1174884163.jpg',
  '/images/products/ao-thun-seventy-seven-13-be-1174883511.jpg',
  '/images/products/ao-so-mi-seventy-seven-22-be-1174882837.jpg',
  '/images/products/ao-thun-non-branded-01-den-1174882387.jpg',
  '/images/products/ao-khoac-the-beginner-m006-xanh-reu-1177436985.jpg',
];

const SAMPLE_NAMES = [
  'Sample Tee',
  'Sample Shirt',
  'Sample Beige Tee',
  'Sample Linen Shirt',
  'Sample Black Tee',
  'Sample Jacket',
];

const SAMPLE_PRICES = [150000, 320000, 180000, 290000, 160000, 450000];

export const SAMPLE_PRODUCTS: ProductListItem[] = SAMPLE_IMAGES.map((image, i) => {
  const id = -(i + 1);
  return {
    id,
    name: SAMPLE_NAMES[i],
    slug: `sample-product-${i + 1}`,
    thumbnail_url: image,
    option1_label: null,
    option2_label: null,
    is_active: true,
    created_at: new Date().toISOString(),
    category_id: 0,
    variants: [
      {
        id,
        product_id: id,
        sku: `SAMPLE-${i + 1}`,
        option1: null,
        option2: null,
        price: SAMPLE_PRICES[i],
        sale_price: null,
        stock_quantity: 99,
      },
    ],
  };
});
