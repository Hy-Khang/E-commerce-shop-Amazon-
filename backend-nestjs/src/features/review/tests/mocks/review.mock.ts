import { Review } from '../../entities/review.entity';
import { mockUser } from '../../../auth/tests/mocks/auth.mock';
import { mockProduct } from '../../../product/tests/mocks/product.mock';
import { mockOrder } from '../../../order/tests/mocks/order.mock';
import { OrderStatus } from '../../../../common/constants';

export const mockReview = (overrides: Partial<Review> = {}): Review => ({
  id: 1,
  user_id: 1,
  product_id: 1,
  order_id: 1,
  rating: 5,
  comment: 'Chất lượng tốt, giao hàng nhanh',
  created_at: new Date('2026-01-15T14:00:00Z'),
  user: mockUser(),
  product: mockProduct(),
  order: mockOrder(),
  ...overrides,
});

export const mockReviewWithUser = (overrides: Partial<Review> = {}): Review =>
  mockReview({
    user: mockUser(),
    ...overrides,
  });

export const mockReviewWithProduct = (overrides: Partial<Review> = {}): Review =>
  mockReview({
    product: mockProduct(),
    ...overrides,
  });

export const mockDeliveredOrderForReview = (
  overrides: Partial<{
    id: number;
    user_id: number;
    status: string;
    order_items: Array<{ id: number; product_variant_id: number }>;
  }> = {},
) => ({
  id: 42,
  user_id: 1,
  status: OrderStatus.Delivered,
  order_items: [
    { id: 1, product_variant_id: 20 },
  ],
  ...overrides,
});

export const mockVariantInfo = (
  overrides: Partial<{ option1: string | null; option2: string | null }> = {},
) => ({
  option1: 'Black' as string | null,
  option2: 'M' as string | null,
  ...overrides,
});

export const mockReviewStats = (
  overrides: Partial<{
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>;
  }> = {},
) => ({
  average_rating: 4.5,
  total_reviews: 10,
  rating_distribution: { 1: 0, 2: 1, 3: 1, 4: 3, 5: 5 },
  ...overrides,
});

export const mockPaginatedReviews = (reviews: Review[] = [mockReview()]) => ({
  data: reviews,
  meta: {
    page: 1,
    limit: 20,
    total: reviews.length,
    totalPages: 1,
  },
});
