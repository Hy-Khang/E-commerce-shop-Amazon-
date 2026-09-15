import { Test, TestingModule } from '@nestjs/testing';
import { AdminReviewController } from '../admin-review.controller';
import { ReviewService } from '../review.service';
import { mockPaginatedReviews } from './mocks/review.mock';

describe('AdminReviewController', () => {
  let controller: AdminReviewController;
  let service: jest.Mocked<ReviewService>;

  beforeEach(async () => {
    const mockService = {
      findAllReviews: jest.fn(),
      deleteReview: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReviewController],
      providers: [{ provide: ReviewService, useValue: mockService }],
    }).compile();

    controller = module.get(AdminReviewController);
    service = module.get(ReviewService);
  });

  describe('findAll', () => {
    it('should call reviewService.findAllReviews with query', async () => {
      // Arrange
      const query = { page: 1, limit: 20, product_id: 10, rating: 5 };
      const mockResult = mockPaginatedReviews([]);
      service.findAllReviews.mockResolvedValue(mockResult);

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(service.findAllReviews).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });
  });

  describe('delete', () => {
    it('should call reviewService.deleteReview with reviewId', async () => {
      // Arrange
      service.deleteReview.mockResolvedValue(undefined);

      // Act
      await controller.delete(7);

      // Assert
      expect(service.deleteReview).toHaveBeenCalledWith(7);
    });
  });
});
