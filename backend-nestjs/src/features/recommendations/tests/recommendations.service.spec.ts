import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsService } from '../recommendations.service';
import { UserActivityLogRepository } from '../repositories/user-activity-log.repository';
import { ProductService } from '../../product/product.service';
import { ActivityAction } from '../types/recommendations.types';

/** Minimal product stub shaped like the hydrated Product cards consume. */
const product = (id: number, categoryId?: number) =>
  ({ id, category: categoryId ? { id: categoryId, name: `Cat${categoryId}` } : undefined }) as any;

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let repo: jest.Mocked<UserActivityLogRepository>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: UserActivityLogRepository,
          useValue: {
            getInteractedProducts: jest.fn().mockResolvedValue([]),
            getViewedCategories: jest.fn().mockResolvedValue([]),
            getCandidatesByCategories: jest.fn().mockResolvedValue([]),
            getBestSellerProductIds: jest.fn().mockResolvedValue([]),
            getTrendingProductIds: jest.fn().mockResolvedValue([]),
            getProductFacts: jest.fn().mockResolvedValue(null),
            getCoViewedIds: jest.fn().mockResolvedValue([]),
            getContentSimilarIds: jest.fn().mockResolvedValue([]),
            getCoPurchasedIds: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ProductService,
          useValue: {
            findActiveByIdsWithStats: jest
              .fn()
              .mockImplementation((ids: number[]) =>
                Promise.resolve(ids.map((id) => product(id))),
              ),
          },
        },
      ],
    }).compile();

    service = module.get(RecommendationsService);
    repo = module.get(UserActivityLogRepository);
    productService = module.get(ProductService);
  });

  describe('getRecommendations', () => {
    it('falls back to best-sellers with no reason when owner is null (guest, no identity)', async () => {
      repo.getBestSellerProductIds.mockResolvedValue([50, 51]);

      const result = await service.getRecommendations(null, 12);

      expect(repo.getInteractedProducts).not.toHaveBeenCalled();
      expect(result.reason).toBeNull();
      expect(result.products.map((p) => p.id)).toEqual([50, 51]);
    });

    it('falls back to best-sellers with no reason on cold start (no activity)', async () => {
      repo.getBestSellerProductIds.mockResolvedValue([7, 8, 9]);

      const result = await service.getRecommendations(
        { userId: 1, sessionId: null },
        12,
      );

      expect(result.reason).toBeNull();
      expect(result.products.map((p) => p.id)).toEqual([7, 8, 9]);
    });

    it('scores candidates, excludes purchased/interacted, and builds a reason', async () => {
      // Profile: category 5 (fashion) preferred, price ~100, shop 3; purchased 1, viewed 2.
      repo.getInteractedProducts.mockResolvedValue([
        {
          action: ActivityAction.Purchase,
          productId: 1,
          categoryId: 5,
          shopId: 3,
          price: 100,
        },
        {
          action: ActivityAction.ViewProduct,
          productId: 2,
          categoryId: 5,
          shopId: 3,
          price: 120,
        },
      ]);
      // Candidates in category 5: 1 (purchased→excluded), 2 (interacted→excluded),
      // 10 (category+price+shop = score 6), 11 (category only = 3), 99 (other cat, no match).
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 1, categoryId: 5, shopId: 3, price: 100 },
        { action: '', productId: 2, categoryId: 5, shopId: 3, price: 110 },
        { action: '', productId: 10, categoryId: 5, shopId: 3, price: 110 },
        { action: '', productId: 11, categoryId: 5, shopId: 9, price: 9999 },
        { action: '', productId: 99, categoryId: 8, shopId: 9, price: 9999 },
      ]);
      productService.findActiveByIdsWithStats.mockImplementation((ids: number[]) =>
        Promise.resolve(ids.map((id) => product(id, 5))),
      );

      const result = await service.getRecommendations(
        { userId: 1, sessionId: null },
        12,
      );

      const ids = result.products.map((p) => p.id);
      expect(ids).not.toContain(1); // purchased
      expect(ids).not.toContain(2); // already interacted
      expect(ids[0]).toBe(10); // highest score (category + price + shop)
      expect(ids).toContain(11);
      expect(result.reason).toBe('Because you like Cat5');
    });

    it('tops up a sparse scored set with best-sellers so the carousel is not blank', async () => {
      repo.getInteractedProducts.mockResolvedValue([
        { action: ActivityAction.ViewProduct, productId: 2, categoryId: 5, shopId: 3, price: 100 },
      ]);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 10, categoryId: 5, shopId: 3, price: 100 },
      ]);
      repo.getBestSellerProductIds.mockResolvedValue([80, 81, 82]);

      const result = await service.getRecommendations(
        { userId: 1, sessionId: null },
        4,
      );

      expect(result.products.map((p) => p.id)).toContain(10);
      expect(result.products.map((p) => p.id)).toContain(80);
    });
  });

  describe('getSimilar', () => {
    it('blends co-view first, then content-similar, excluding self', async () => {
      repo.getProductFacts.mockResolvedValue({ categoryId: 5, price: 100 });
      repo.getCoViewedIds.mockResolvedValue([30, 31]);
      repo.getContentSimilarIds.mockResolvedValue([31, 32, 33]);

      const result = await service.getSimilar(1, 12);

      // co-view first (30, 31), then content-similar fills (32, 33); 31 deduped; self excluded.
      expect(result.map((p) => p.id)).toEqual([30, 31, 32, 33]);
    });

    it('falls back to best-sellers when both signals are empty', async () => {
      repo.getProductFacts.mockResolvedValue({ categoryId: null, price: null });
      repo.getBestSellerProductIds.mockResolvedValue([60, 61]);

      const result = await service.getSimilar(1, 12);

      expect(result.map((p) => p.id)).toEqual([60, 61]);
    });
  });

  describe('getFrequentlyBoughtTogether', () => {
    it('returns co-purchase products when present', async () => {
      repo.getCoPurchasedIds.mockResolvedValue([40, 41]);

      const result = await service.getFrequentlyBoughtTogether(1, 12);

      expect(result.map((p) => p.id)).toEqual([40, 41]);
      expect(repo.getCoViewedIds).not.toHaveBeenCalled();
    });

    it('falls back to Similar when co-purchase is empty', async () => {
      repo.getCoPurchasedIds.mockResolvedValue([]);
      repo.getProductFacts.mockResolvedValue({ categoryId: 5, price: 100 });
      repo.getContentSimilarIds.mockResolvedValue([35, 36]);

      const result = await service.getFrequentlyBoughtTogether(1, 12);

      expect(result.map((p) => p.id)).toEqual([35, 36]);
    });
  });
});
