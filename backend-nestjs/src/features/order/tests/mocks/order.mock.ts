import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../../common/constants';
import {
  mockProduct,
  mockProductVariant,
} from '../../../product/tests/mocks/product.mock';

export const mockShippingAddress = (
  overrides: Partial<{ full_name: string; phone: string; address_line: string; city: string }> = {},
) => ({
  full_name: 'Nguyen Van A',
  phone: '0901234567',
  address_line: '123 Le Loi',
  city: 'Ho Chi Minh',
  ...overrides,
});

export const mockOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 1,
  order_id: 1,
  product_variant_id: 1,
  product_name: 'Wireless Headphones',
  sku: 'ELEC-BLK-M',
  price: 250000,
  quantity: 2,
  thumbnail_url: 'https://cdn.example.com/img/headphones.jpg',
  variant_option1_label: null,
  variant_option1_value: null,
  variant_option2_label: null,
  variant_option2_value: null,
  order: null as any,
  product_variant: mockProductVariant(),
  ...overrides,
});

export const mockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  user_id: 1,
  status: OrderStatus.Pending,
  payment_method: PaymentMethod.Cod,
  payment_status: PaymentStatus.Unpaid,
  shipping_fee: 30000,
  total_amount: 530000,
  shipping_address: JSON.stringify(mockShippingAddress()),
  coupon_code: null,
  discount_amount: 0,
  created_at: new Date('2026-01-15T10:00:00Z'),
  user: null as any,
  order_items: [mockOrderItem()],
  ...overrides,
});

export const mockOrderWithUser = (overrides: Partial<Order> = {}): Order =>
  mockOrder({
    user: {
      id: 1,
      email: 'test@test.com',
      full_name: 'Nguyen Van A',
      role_id: 1,
      password_hash: '',
      phone: '0901234567',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      role: null as any,
      refresh_tokens: [],
      addresses: [],
    } as any,
    ...overrides,
  });

export const mockCartForCheckout = (itemCount = 1) => {
  const items = Array.from({ length: itemCount }, (_, i) => {
    const product = mockProduct({ id: i + 1, name: `Product ${i + 1}` });
    const variant = mockProductVariant({
      id: i + 10,
      sku: `SKU-${i + 1}`,
      price: 250000,
      sale_price: null as any,
      stock_quantity: 100,
      product,
      product_id: product.id,
    });
    return {
      id: i + 1,
      product_variant_id: variant.id,
      quantity: i + 1,
      product_variant: variant,
    };
  });

  return { id: 1, items };
};

export const mockAddress = (overrides: Partial<{
  id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
}> = {}) => ({
  id: 5,
  full_name: 'Nguyen Van A',
  phone: '0901234567',
  address_line: '123 Le Loi',
  city: 'Ho Chi Minh',
  ...overrides,
});

export const mockPaginatedOrders = (orders: Order[] = [mockOrder()]) => ({
  data: orders,
  meta: {
    page: 1,
    limit: 20,
    total: orders.length,
    totalPages: 1,
  },
});
