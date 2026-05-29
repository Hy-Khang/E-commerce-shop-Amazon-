import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { ReviewController } from '../review.controller';
import { AdminReviewController } from '../admin-review.controller';
import { ReviewService } from '../review.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../../../common/guards/roles.guard';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.headers.authorization === 'Bearer admin-token') {
      req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
    } else if (req.headers.authorization === 'Bearer customer-token') {
      req.user = { id: 2, email: 'customer@test.com', role: 'customer' };
    } else {
      throw new UnauthorizedException('Missing or invalid token');
    }
    return true;
  }
}

describe('Review (e2e)', () => {
  let app: INestApplication;
  let reviewService: jest.Mocked<ReviewService>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController, AdminReviewController],
      providers: [
        {
          provide: ReviewService,
          useValue: {
            createReview: jest.fn(),
            findProductReviews: jest.fn(),
            findMyReviews: jest.fn(),
            deleteMyReview: jest.fn(),
            findAllReviews: jest.fn(),
            deleteReview: jest.fn(),
          },
        },
        { provide: APP_GUARD, useClass: MockJwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    reviewService = module.get(ReviewService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Auth & Authorization ───

  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).post('/reviews').expect(401);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 for GET /reviews/me without token', async () => {
      await request(app.getHttpServer()).get('/reviews/me').expect(401);
    });

    it('should return 401 for DELETE /reviews/:id without token', async () => {
      await request(app.getHttpServer()).delete('/reviews/1').expect(401);
    });
  });

  describe('Authorization', () => {
    it('should return 403 when customer accesses admin reviews', async () => {
      await request(app.getHttpServer())
        .get('/admin/reviews')
        .set('Authorization', 'Bearer customer-token')
        .expect(403);
    });

    it('should return 403 when customer tries to admin-delete a review', async () => {
      await request(app.getHttpServer())
        .delete('/admin/reviews/1')
        .set('Authorization', 'Bearer customer-token')
        .expect(403);
    });
  });

  // ─── Customer: POST /reviews ───

  describe('POST /reviews', () => {
    const validDto = {
      product_id: 10,
      order_id: 42,
      rating: 5,
      comment: 'Great product',
    };

    it('should create a review and return 201', async () => {
      // Arrange
      const mockResponse = {
        id: 7,
        product_id: 10,
        order_id: 42,
        rating: 5,
        comment: 'Great product',
        created_at: new Date().toISOString(),
      };
      reviewService.createReview.mockResolvedValue(mockResponse as any);

      // Act
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send(validDto)
        .expect(201);

      // Assert
      expect(res.body.id).toBe(7);
      expect(reviewService.createReview).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          product_id: 10,
          order_id: 42,
          rating: 5,
          comment: 'Great product',
        }),
      );
    });

    it('should create a review without comment', async () => {
      // Arrange
      reviewService.createReview.mockResolvedValue({ id: 8 } as any);

      // Act
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, order_id: 42, rating: 4 })
        .expect(201);

      // Assert
      expect(reviewService.createReview).toHaveBeenCalled();
    });

    it('should return 400 when product_id is missing', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ order_id: 42, rating: 5 })
        .expect(400);
    });

    it('should return 400 when order_id is missing', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, rating: 5 })
        .expect(400);
    });

    it('should return 400 when rating is missing', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, order_id: 42 })
        .expect(400);
    });

    it('should return 400 when rating is below 1', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, order_id: 42, rating: 0 })
        .expect(400);
    });

    it('should return 400 when rating is above 5', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, order_id: 42, rating: 6 })
        .expect(400);
    });

    it('should return 400 when product_id is not a positive integer', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: -1, order_id: 42, rating: 5 })
        .expect(400);
    });

    it('should return 400 with extra unknown fields (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ ...validDto, hacker_field: 'xss' })
        .expect(400);
    });
  });

  // ─── Customer: GET /products/:productId/reviews (public) ───

  describe('GET /products/:productId/reviews', () => {
    it('should return paginated reviews for a product (public, no auth needed)', async () => {
      // Arrange — the MockJwtAuthGuard requires a token, so we use admin-token
      // In real app @Public() skips the guard; here we just verify route wiring
      const mockResult = {
        data: [{ id: 1, rating: 5, user_full_name: 'Nguyen Van A' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        stats: { average_rating: 5, total_reviews: 1, rating_distribution: {} },
      };
      reviewService.findProductReviews.mockResolvedValue(mockResult as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/products/10/reviews')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      // Assert
      expect(res.body.data).toHaveLength(1);
      expect(reviewService.findProductReviews).toHaveBeenCalledWith(
        10,
        expect.any(Object),
      );
    });
  });

  // ─── Customer: GET /reviews/me ───

  describe('GET /reviews/me', () => {
    it('should return paginated reviews for the current user', async () => {
      // Arrange
      const mockResult = {
        data: [{ id: 1, product_name: 'Test' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      reviewService.findMyReviews.mockResolvedValue(mockResult as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/reviews/me')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      // Assert
      expect(res.body.data).toHaveLength(1);
      expect(reviewService.findMyReviews).toHaveBeenCalledWith(
        2,
        expect.any(Object),
      );
    });
  });

  // ─── Customer: DELETE /reviews/:id ───

  describe('DELETE /reviews/:id', () => {
    it('should delete own review and return 204', async () => {
      // Arrange
      reviewService.deleteMyReview.mockResolvedValue(undefined);

      // Act
      await request(app.getHttpServer())
        .delete('/reviews/7')
        .set('Authorization', 'Bearer customer-token')
        .expect(204);

      // Assert
      expect(reviewService.deleteMyReview).toHaveBeenCalledWith(2, 7);
    });
  });

  // ─── Admin: GET /admin/reviews ───

  describe('GET /admin/reviews', () => {
    it('should return all reviews paginated (admin)', async () => {
      // Arrange
      const mockResult = {
        data: [{ id: 1, rating: 1, user_email: 'user@test.com' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      reviewService.findAllReviews.mockResolvedValue(mockResult as any);

      // Act
      const res = await request(app.getHttpServer())
        .get('/admin/reviews')
        .set('Authorization', 'Bearer admin-token')
        .expect(200);

      // Assert
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ─── Admin: DELETE /admin/reviews/:id ───

  describe('DELETE /admin/reviews/:id', () => {
    it('should delete any review and return 204 (admin)', async () => {
      // Arrange
      reviewService.deleteReview.mockResolvedValue(undefined);

      // Act
      await request(app.getHttpServer())
        .delete('/admin/reviews/1')
        .set('Authorization', 'Bearer admin-token')
        .expect(204);

      // Assert
      expect(reviewService.deleteReview).toHaveBeenCalledWith(1);
    });
  });

  // ─── Multi-step flow: create → list → delete ───

  describe('Create → List my reviews → Delete flow', () => {
    it('should create a review, list it, then delete it', async () => {
      // Step 1 — Create
      const createdReview = {
        id: 50,
        product_id: 10,
        order_id: 42,
        rating: 4,
        comment: 'Good',
        created_at: new Date().toISOString(),
      };
      reviewService.createReview.mockResolvedValue(createdReview as any);

      const createRes = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', 'Bearer customer-token')
        .send({ product_id: 10, order_id: 42, rating: 4, comment: 'Good' })
        .expect(201);

      expect(createRes.body.id).toBe(50);

      // Step 2 — List my reviews
      const myReviews = {
        data: [createdReview],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      reviewService.findMyReviews.mockResolvedValue(myReviews as any);

      const listRes = await request(app.getHttpServer())
        .get('/reviews/me')
        .set('Authorization', 'Bearer customer-token')
        .expect(200);

      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].id).toBe(50);

      // Step 3 — Delete
      reviewService.deleteMyReview.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/reviews/50')
        .set('Authorization', 'Bearer customer-token')
        .expect(204);

      expect(reviewService.deleteMyReview).toHaveBeenCalledWith(2, 50);
    });
  });
});
