import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from '../recommendations.controller';
import { RecommendationsService } from '../recommendations.service';
import { ActivityService } from '../activity.service';
import { ActivityAction, ActivityTargetType } from '../types/recommendations.types';
import { RecordActivityDto } from '../dto/record-activity.dto';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let recommendationsService: jest.Mocked<RecommendationsService>;
  let activityService: jest.Mocked<ActivityService>;

  const dto: RecordActivityDto = {
    action: ActivityAction.ViewProduct,
    target_type: ActivityTargetType.Product,
    target_id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationsService,
          useValue: {
            getRecommendations: jest.fn().mockResolvedValue({ reason: null, products: [] }),
            getSimilar: jest.fn().mockResolvedValue([]),
            getFrequentlyBoughtTogether: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: ActivityService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    controller = module.get(RecommendationsController);
    recommendationsService = module.get(RecommendationsService);
    activityService = module.get(ActivityService);
  });

  describe('POST /activity (lenient)', () => {
    it('records with a user owner when a JWT is present', async () => {
      await controller.recordActivity({ id: 7, roleId: 1 }, undefined, dto);
      expect(activityService.record).toHaveBeenCalledWith(
        { userId: 7, sessionId: null },
        dto,
      );
    });

    it('records with a session owner for a guest', async () => {
      await controller.recordActivity(undefined, 'sess-abc', dto);
      expect(activityService.record).toHaveBeenCalledWith(
        { userId: null, sessionId: 'sess-abc' },
        dto,
      );
    });

    it('passes a null owner (silent no-op) when there is no identity', async () => {
      await controller.recordActivity(undefined, undefined, dto);
      expect(activityService.record).toHaveBeenCalledWith(null, dto);
    });
  });

  describe('GET /recommendations', () => {
    it('resolves the JWT user as the owner', async () => {
      await controller.getRecommendations({ id: 7, roleId: 1 }, undefined, 12);
      expect(recommendationsService.getRecommendations).toHaveBeenCalledWith(
        { userId: 7, sessionId: null },
        12,
      );
    });

    it('resolves a guest session as the owner', async () => {
      await controller.getRecommendations(undefined, 'sess-1', 5);
      expect(recommendationsService.getRecommendations).toHaveBeenCalledWith(
        { userId: null, sessionId: 'sess-1' },
        5,
      );
    });
  });

  describe('product-scoped routes', () => {
    it('wraps similar products in { products }', async () => {
      recommendationsService.getSimilar.mockResolvedValue([{ id: 1 }] as any);
      const res = await controller.getSimilar(1, 12);
      expect(res).toEqual({ products: [{ id: 1 }] });
    });

    it('wraps frequently-bought-together in { products }', async () => {
      recommendationsService.getFrequentlyBoughtTogether.mockResolvedValue([{ id: 2 }] as any);
      const res = await controller.getFrequentlyBoughtTogether(2, 12);
      expect(res).toEqual({ products: [{ id: 2 }] });
    });
  });
});
