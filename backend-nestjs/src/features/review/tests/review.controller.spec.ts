import { Test, TestingModule } from '@nestjs/testing';
import { ReviewController } from '../review.controller';
import { ReviewService } from '../review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import type { ICurrentUser } from '../../../common/interfaces/current-user.interface';

describe('ReviewController', () => {
  let controller: ReviewController;
  let service: jest.Mocked<ReviewService>;

  const mockUser: ICurrentUser = {
    id: 1,
    roleId: 1,
  };

  beforeEach(async () => {
    const mockService = {
      createReview: jest.fn(),
      findProductReviews: jest.fn(),
      findMyReviews: jest.fn(),
      deleteMyReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: ReviewService, useValue: mockService }],
    }).compile();

    controller = module.get(ReviewController);
    service = module.get(ReviewService);
  });

  describe('create', () => {
    it('should call reviewService.createReview with userId and dto', async () => {
      const dto: CreateReviewDto = {
        product_id: 10,
        order_id: 42,
        rating: 5,
        comment: 'Great product',
      };
      const mockResponse = { id: 7, rating: 5 };
      service.createReview.mockResolvedValue(mockResponse as any);

      const result = await controller.create(mockUser, dto);

      expect(service.createReview).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findProductReviews', () => {
    it('should call reviewService.findProductReviews with productId and query', async () => {
      const query = { page: 1, limit: 20 };
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findProductReviews.mockResolvedValue(mockResult as any);

      const result = await controller.findProductReviews(10, query);

      expect(service.findProductReviews).toHaveBeenCalledWith(10, query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMyReviews', () => {
    it('should call reviewService.findMyReviews with userId and query', async () => {
      const query = { page: 1, limit: 20 };
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
      service.findMyReviews.mockResolvedValue(mockResult);

      const result = await controller.findMyReviews(mockUser, query);

      expect(service.findMyReviews).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteMyReview', () => {
    it('should call reviewService.deleteMyReview with userId and reviewId', async () => {
      service.deleteMyReview.mockResolvedValue(undefined);

      await controller.deleteMyReview(mockUser, 7);

      expect(service.deleteMyReview).toHaveBeenCalledWith(mockUser.id, 7);
    });
  });
});
