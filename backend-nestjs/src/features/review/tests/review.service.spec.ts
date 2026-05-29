import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ReviewService } from '../review.service';
import { ReviewRepository } from '../repositories/review.repository';
import { OrderService } from '../../order/order.service';
import { ProductService } from '../../product/product.service';
import { OrderStatus } from '../../../common/constants';
import {
  mockReview,
  mockReviewWithUser,
  mockDeliveredOrderForReview,
  mockVariantInfo,
  mockReviewStats,
  mockPaginatedReviews,
} from './mocks/review.mock';
import { mockProductVariant } from '../../product/tests/mocks/product.mock';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepository: jest.Mocked<ReviewRepository>;
  let orderService: jest.Mocked<OrderService>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: ReviewRepository,
          useValue: {
            findById: jest.fn(),
            findByIdWithUser: jest.fn(),
            findByUserAndOrderAndProduct: jest.fn(),
            findByProductIdPaginated: jest.fn(),
            findByUserIdPaginated: jest.fn(),
            findAllPaginated: jest.fn(),
            findVariantInfoForReviews: jest.fn(),
            getReviewStats: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: OrderService,
          useValue: { findOrderByIdForReview: jest.fn() },
        },
        {
          provide: ProductService,
          useValue: { findVariantById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ReviewService);
    reviewRepository = module.get(ReviewRepository);
    orderService = module.get(OrderService);
    productService = module.get(ProductService);
  });

  // ─── createReview ───

  describe('createReview', () => {
    const userId = 1;
    const dto = { product_id: 10, order_id: 42, rating: 5, comment: 'Great' };

    it('should create a review for a delivered order', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({
        order_items: [{ id: 1, product_variant_id: 20 }],
      });
      const variant = mockProductVariant({ id: 20, product_id: 10 });
      const created = mockReview({
        id: 7,
        user_id: 1,
        product_id: 10,
        order_id: 42,
        rating: 5,
        comment: 'Great',
      });

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(variant);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(created as any);

      // Act
      const result = await service.createReview(userId, dto);

      // Assert
      expect(result.id).toBe(7);
      expect(result.rating).toBe(5);
      expect(reviewRepository.create).toHaveBeenCalledWith({
        user_id: 1,
        product_id: 10,
        order_id: 42,
        rating: 5,
        comment: 'Great',
      });
    });

    it('should set comment to null when not provided', async () => {
      // Arrange
      const dtoNoComment = { product_id: 10, order_id: 42, rating: 4 };
      const order = mockDeliveredOrderForReview();
      const variant = mockProductVariant({ id: 20, product_id: 10 });
      const created = mockReview({ comment: null, rating: 4 });

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(variant);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(created as any);

      // Act
      await service.createReview(userId, dtoNoComment);

      // Assert
      expect(reviewRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ comment: null }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      orderService.findOrderByIdForReview.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when order does not belong to user', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({ user_id: 999 });
      orderService.findOrderByIdForReview.mockResolvedValue(order as any);

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when order is not delivered', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({
        status: OrderStatus.Pending,
      });
      orderService.findOrderByIdForReview.mockResolvedValue(order as any);

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when product is not in the order', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({
        order_items: [{ id: 1, product_variant_id: 20 }],
      });
      const variantForDifferentProduct = mockProductVariant({
        id: 20,
        product_id: 999,
      });

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(
        variantForDifferentProduct,
      );

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when variant is not found for any order item', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({
        order_items: [{ id: 1, product_variant_id: 20 }],
      });

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should skip order items with null product_variant_id', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview({
        order_items: [
          { id: 1, product_variant_id: null as any },
          { id: 2, product_variant_id: 20 },
        ],
      });
      const variant = mockProductVariant({ id: 20, product_id: 10 });
      const created = mockReview();

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(variant);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(created as any);

      // Act
      await service.createReview(userId, dto);

      // Assert — only called once (skipped the null variant)
      expect(productService.findVariantById).toHaveBeenCalledTimes(1);
      expect(productService.findVariantById).toHaveBeenCalledWith(20);
    });

    it('should throw ConflictException when duplicate review exists', async () => {
      // Arrange
      const order = mockDeliveredOrderForReview();
      const variant = mockProductVariant({ id: 20, product_id: 10 });

      orderService.findOrderByIdForReview.mockResolvedValue(order as any);
      productService.findVariantById.mockResolvedValue(variant);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue(
        mockReview() as any,
      );

      // Act & Assert
      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── findProductReviews ───

  describe('findProductReviews', () => {
    it('should return paginated reviews with user info, variant info, and stats', async () => {
      // Arrange
      const review = mockReviewWithUser({
        id: 1,
        product_id: 10,
        order_id: 42,
      });
      const paginatedResult = mockPaginatedReviews([review]);
      const variantMap = new Map([
        ['42-10', { color: 'Black', size: 'M' }],
      ]);
      const stats = mockReviewStats();

      reviewRepository.findByProductIdPaginated.mockResolvedValue(
        paginatedResult as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(
        variantMap as any,
      );
      reviewRepository.getReviewStats.mockResolvedValue(stats);

      // Act
      const result = await service.findProductReviews(10, {
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_full_name).toBe('Nguyen Van A');
      expect(result.data[0].variant_color).toBe('Black');
      expect(result.data[0].variant_size).toBe('M');
      expect(result.stats.average_rating).toBe(4.5);
      expect(result.stats.total_reviews).toBe(10);
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      const paginatedResult = mockPaginatedReviews([]);
      reviewRepository.findByProductIdPaginated.mockResolvedValue(
        paginatedResult as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(new Map());
      reviewRepository.getReviewStats.mockResolvedValue(mockReviewStats());

      // Act
      await service.findProductReviews(10, {});

      // Assert
      expect(reviewRepository.findByProductIdPaginated).toHaveBeenCalledWith(
        10,
        1,
        20,
        undefined,
        undefined,
      );
    });

    it('should handle reviews without variant info', async () => {
      // Arrange
      const review = mockReviewWithUser({
        id: 1,
        product_id: 10,
        order_id: 42,
      });
      const paginatedResult = mockPaginatedReviews([review]);

      reviewRepository.findByProductIdPaginated.mockResolvedValue(
        paginatedResult as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(new Map());
      reviewRepository.getReviewStats.mockResolvedValue(mockReviewStats());

      // Act
      const result = await service.findProductReviews(10, { page: 1, limit: 20 });

      // Assert
      expect(result.data[0].variant_color).toBeNull();
      expect(result.data[0].variant_size).toBeNull();
    });
  });

  // ─── findMyReviews ───

  describe('findMyReviews', () => {
    it('should return paginated reviews for current user with product and variant info', async () => {
      // Arrange
      const review = mockReview({
        id: 1,
        user_id: 1,
        product_id: 10,
        order_id: 42,
      });
      review.product = {
        id: 10,
        name: 'Wireless Headphones',
        thumbnail_url: 'https://cdn.example.com/img/headphones.jpg',
      } as any;
      const paginatedResult = mockPaginatedReviews([review]);
      const variantMap = new Map([
        ['42-10', { color: 'Red', size: 'L' }],
      ]);

      reviewRepository.findByUserIdPaginated.mockResolvedValue(
        paginatedResult as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(
        variantMap as any,
      );

      // Act
      const result = await service.findMyReviews(1, { page: 1, limit: 20 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].product_name).toBe('Wireless Headphones');
      expect(result.data[0].variant_color).toBe('Red');
      expect(result.data[0].variant_size).toBe('L');
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      reviewRepository.findByUserIdPaginated.mockResolvedValue(
        mockPaginatedReviews([]) as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(new Map());

      // Act
      await service.findMyReviews(1, {});

      // Assert
      expect(reviewRepository.findByUserIdPaginated).toHaveBeenCalledWith(
        1,
        1,
        20,
        undefined,
        undefined,
      );
    });
  });

  // ─── deleteMyReview ───

  describe('deleteMyReview', () => {
    it('should delete own review', async () => {
      // Arrange
      reviewRepository.findById.mockResolvedValue(
        mockReview({ id: 1, user_id: 1 }) as any,
      );

      // Act
      await service.deleteMyReview(1, 1);

      // Assert
      expect(reviewRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      // Arrange
      reviewRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteMyReview(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when review belongs to another user', async () => {
      // Arrange
      reviewRepository.findById.mockResolvedValue(
        mockReview({ id: 1, user_id: 999 }) as any,
      );

      // Act & Assert
      await expect(service.deleteMyReview(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Admin: findAllReviews ───

  describe('findAllReviews', () => {
    it('should return paginated admin reviews with user and product info', async () => {
      // Arrange
      const review = mockReview({
        id: 1,
        user_id: 1,
        product_id: 10,
        order_id: 42,
      });
      review.user = {
        id: 1,
        email: 'user@test.com',
        full_name: 'Nguyen Van A',
      } as any;
      review.product = {
        id: 10,
        name: 'Wireless Headphones',
        thumbnail_url: 'https://cdn.example.com/img/headphones.jpg',
      } as any;
      const paginatedResult = mockPaginatedReviews([review]);
      const variantMap = new Map([
        ['42-10', { color: 'Black', size: 'M' }],
      ]);

      reviewRepository.findAllPaginated.mockResolvedValue(
        paginatedResult as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(
        variantMap as any,
      );

      // Act
      const result = await service.findAllReviews({ page: 1, limit: 20 });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_email).toBe('user@test.com');
      expect(result.data[0].user_full_name).toBe('Nguyen Van A');
      expect(result.data[0].product_name).toBe('Wireless Headphones');
      expect(result.data[0].variant_color).toBe('Black');
    });

    it('should pass query filters through to repository', async () => {
      // Arrange
      const query = { page: 2, limit: 10, product_id: 5, rating: 3 };
      reviewRepository.findAllPaginated.mockResolvedValue(
        mockPaginatedReviews([]) as any,
      );
      reviewRepository.findVariantInfoForReviews.mockResolvedValue(new Map());

      // Act
      await service.findAllReviews(query);

      // Assert
      expect(reviewRepository.findAllPaginated).toHaveBeenCalledWith(query);
    });
  });

  // ─── Admin: deleteReview ───

  describe('deleteReview', () => {
    it('should delete any review', async () => {
      // Arrange
      reviewRepository.findById.mockResolvedValue(mockReview() as any);

      // Act
      await service.deleteReview(1);

      // Assert
      expect(reviewRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      // Arrange
      reviewRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteReview(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
