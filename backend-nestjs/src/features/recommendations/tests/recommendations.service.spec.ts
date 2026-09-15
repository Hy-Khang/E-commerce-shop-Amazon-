import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RecommendationsService } from '../recommendations.service';
import { RecommendationReasonService } from '../recommendation-reason.service';
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
            getSearchedCategories: jest.fn().mockResolvedValue([]),
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
        RecommendationReasonService,
        {
          // aiReason off + no api key → describe() returns the rule-based label.
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
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

    it('personalizes from SEARCH-derived categories when no other signal exists', async () => {
      // Only signal: the user searched keywords that map to category 7.
      repo.getSearchedCategories.mockResolvedValue([{ categoryId: 7, count: 2 }]);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 70, categoryId: 7, shopId: 1, price: 100 },
      ]);
      productService.findActiveByIdsWithStats.mockImplementation((ids: number[]) =>
        Promise.resolve(ids.map((id) => product(id, 7))),
      );

      const result = await service.getRecommendations(
        { userId: 1, sessionId: null },
        12,
      );

      // Not treated as cold-start; the searched category drives candidates + reason.
      expect(repo.getCandidatesByCategories).toHaveBeenCalledWith([7]);
      expect(result.products.map((p) => p.id)).toContain(70);
      expect(result.reason).toBe('Because you like Cat7');
    });

    it('ranks a stronger-preference category above a weaker one (weighted, not binary)', async () => {
      // Category 5 far outweighs 8 (Purchase×5 vs a single View). With the old
      // binary +3 both candidates would tie; weighted scoring separates them.
      repo.getInteractedProducts.mockResolvedValue([
        { action: ActivityAction.Purchase, productId: 1, categoryId: 5, shopId: null, price: null },
        { action: ActivityAction.ViewProduct, productId: 2, categoryId: 8, shopId: null, price: null },
      ]);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 80, categoryId: 8, shopId: null, price: null },
        { action: '', productId: 50, categoryId: 5, shopId: null, price: null },
      ]);

      const result = await service.getRecommendations({ userId: 1, sessionId: null }, 12);

      const ids = result.products.map((p) => p.id);
      expect(ids[0]).toBe(50); // stronger category wins despite candidate array order
      expect(ids.indexOf(50)).toBeLessThan(ids.indexOf(80));
    });

    it('breaks equal scores by best-seller rank', async () => {
      // Both candidates: same category, no price/shop signal → identical score.
      repo.getInteractedProducts.mockResolvedValue([
        { action: ActivityAction.ViewProduct, productId: 1, categoryId: 5, shopId: null, price: null },
      ]);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 50, categoryId: 5, shopId: null, price: null },
        { action: '', productId: 51, categoryId: 5, shopId: null, price: null },
      ]);
      repo.getBestSellerProductIds.mockResolvedValue([51, 50]); // 51 ranks first

      const result = await service.getRecommendations({ userId: 1, sessionId: null }, 12);

      expect(result.products.map((p) => p.id)).toEqual([51, 50]);
    });

    it('uses a percentile price band so an outlier does not widen it (no free +2)', async () => {
      // 9 items ~100 + one 10000 outlier. Raw max would let a 5000 candidate score
      // +2; the p90 band (~100) excludes it, so the in-band candidate ranks first.
      const rows = Array.from({ length: 9 }, (_, i) => ({
        action: ActivityAction.ViewProduct,
        productId: i + 1,
        categoryId: 5,
        shopId: null,
        price: 100,
      }));
      rows.push({ action: ActivityAction.ViewProduct, productId: 10, categoryId: 5, shopId: null, price: 10000 });
      repo.getInteractedProducts.mockResolvedValue(rows);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 51, categoryId: 5, shopId: null, price: 5000 }, // out of band
        { action: '', productId: 50, categoryId: 5, shopId: null, price: 100 }, // in band → +2
      ]);

      const result = await service.getRecommendations({ userId: 1, sessionId: null }, 12);

      const ids = result.products.map((p) => p.id);
      expect(ids[0]).toBe(50);
      expect(ids.indexOf(50)).toBeLessThan(ids.indexOf(51));
    });

    it('decays old signals so a recent weaker signal outranks an older stronger one', async () => {
      const recent = new Date();
      const old = new Date(Date.now() - 60 * 86_400_000); // ~2 half-lives → ×0.25
      // Raw weight: cat 8 (2 views) > cat 5 (1 view). After decay: cat5=1 > cat8=0.5.
      repo.getInteractedProducts.mockResolvedValue([
        { action: ActivityAction.ViewProduct, productId: 1, categoryId: 5, shopId: null, price: null, createdAt: recent },
        { action: ActivityAction.ViewProduct, productId: 2, categoryId: 8, shopId: null, price: null, createdAt: old },
        { action: ActivityAction.ViewProduct, productId: 3, categoryId: 8, shopId: null, price: null, createdAt: old },
      ]);
      repo.getCandidatesByCategories.mockResolvedValue([
        { action: '', productId: 80, categoryId: 8, shopId: null, price: null },
        { action: '', productId: 50, categoryId: 5, shopId: null, price: null },
      ]);

      const result = await service.getRecommendations({ userId: 1, sessionId: null }, 12);

      // Recency flips what raw counts would have ranked first.
      expect(result.products.map((p) => p.id)[0]).toBe(50);
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
