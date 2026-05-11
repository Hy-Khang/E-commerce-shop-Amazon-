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
          useValue: { findProductByIdPublic: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ReviewService);
    reviewRepository = module.get(ReviewRepository);
    orderService = module.get(OrderService);
    productService = module.get(ProductService);
  });

  describe('createReview', () => {
    const userId = 1;
    const dto = { product_id: 10, order_id: 42, rating: 5, comment: 'Great' };

    it('should create a review for a delivered order', async () => {
      // Arrange
      const mockOrder = {
        id: 42,
        user_id: 1,
        status: OrderStatus.Delivered,
        order_items: [
          {
            id: 1,
            product_variant_id: 20,
            product_variant: { product_id: 10 },
          },
        ],
      };
      const mockReview = {
        id: 7,
        user_id: 1,
        product_id: 10,
        order_id: 42,
        rating: 5,
        comment: 'Great',
        created_at: new Date(),
      };

      orderService.findOrderByIdForReview.mockResolvedValue(mockOrder as any);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(mockReview as any);

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

    it('should throw ForbiddenException when order does not belong to user', async () => {
      orderService.findOrderByIdForReview.mockResolvedValue({
        id: 42,
        user_id: 999,
        status: OrderStatus.Delivered,
      } as any);

      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when order is not delivered', async () => {
      orderService.findOrderByIdForReview.mockResolvedValue({
        id: 42,
        user_id: 1,
        status: OrderStatus.Pending,
      } as any);

      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException when duplicate review exists', async () => {
      const mockOrder = {
        id: 42,
        user_id: 1,
        status: OrderStatus.Delivered,
        order_items: [
          {
            id: 1,
            product_variant_id: 20,
            product_variant: { product_id: 10 },
          },
        ],
      };
      orderService.findOrderByIdForReview.mockResolvedValue(mockOrder as any);
      reviewRepository.findByUserAndOrderAndProduct.mockResolvedValue({
        id: 99,
      } as any);

      await expect(service.createReview(userId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteMyReview', () => {
    it('should delete own review', async () => {
      reviewRepository.findById.mockResolvedValue({
        id: 1,
        user_id: 1,
      } as any);

      await service.deleteMyReview(1, 1);

      expect(reviewRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw ForbiddenException when review belongs to another user', async () => {
      reviewRepository.findById.mockResolvedValue({
        id: 1,
        user_id: 999,
      } as any);

      await expect(service.deleteMyReview(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when review does not exist', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(service.deleteMyReview(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteReview (admin)', () => {
    it('should delete any review', async () => {
      reviewRepository.findById.mockResolvedValue({ id: 1 } as any);

      await service.deleteReview(1);

      expect(reviewRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(service.deleteReview(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findProductReviews', () => {
    it('should return paginated reviews for a product', async () => {
      const mockResult = {
        data: [
          {
            id: 1,
            product_id: 10,
            order_id: 42,
            rating: 5,
            comment: 'Nice',
            created_at: new Date(),
            user: { full_name: 'Nguyen Van A' },
          },
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      reviewRepository.findByProductIdPaginated.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.findProductReviews(10, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_full_name).toBe('Nguyen Van A');
    });
  });
});
