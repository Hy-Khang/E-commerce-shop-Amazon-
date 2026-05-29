import { Cart } from '../../entities/cart.entity';
import { CartItem } from '../../entities/cart-item.entity';
import { CartResponseDto } from '../../dto/cart-response.dto';
import { mockProductVariant, mockProduct } from '../../../product/tests/mocks/product.mock';

export const mockCart = (overrides: Partial<Cart> = {}): Cart => ({
  id: 1,
  user_id: 1,
  session_id: null as any,
  created_at: new Date('2026-01-01T00:00:00Z'),
  user: null as any,
  items: [],
  ...overrides,
});

export const mockCartItem = (overrides: Partial<CartItem> = {}): CartItem => {
  const product = mockProduct();
  const variant = mockProductVariant({ product });
  return {
    id: 1,
    cart_id: 1,
    product_variant_id: variant.id,
    quantity: 2,
    cart: null as any,
    product_variant: variant,
    ...overrides,
  };
};

export const mockCartWithItems = (itemCount = 2): Cart => {
  const items = Array.from({ length: itemCount }, (_, i) => {
    const product = mockProduct({ id: i + 1, name: `Product ${i + 1}` });
    const variant = mockProductVariant({
      id: i + 1,
      sku: `SKU-${i + 1}`,
      product,
      product_id: product.id,
    });
    return mockCartItem({
      id: i + 1,
      product_variant_id: variant.id,
      quantity: i + 1,
      product_variant: variant,
    });
  });
  return mockCart({ items });
};

export const mockGuestCart = (overrides: Partial<Cart> = {}): Cart =>
  mockCart({
    user_id: null as any,
    session_id: 'guest-session-abc',
    ...overrides,
  });

export const mockCartResponse = (
  overrides: Partial<CartResponseDto> = {},
): CartResponseDto => ({
  id: 1,
  items: [
    {
      id: 1,
      product_variant_id: 1,
      quantity: 2,
      variant: {
        sku: 'ELEC-BLK-M',
        price: 250000,
        sale_price: null,
        color: 'Black',
        size: 'M',
        stock_quantity: 100,
        product_name: 'Wireless Headphones',
        thumbnail_url: 'https://cdn.example.com/img/headphones.jpg',
      },
    },
  ],
  ...overrides,
});
