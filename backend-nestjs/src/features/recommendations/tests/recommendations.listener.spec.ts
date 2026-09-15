import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsListener } from '../recommendations.listener';
import { ActivityService } from '../activity.service';
import { ProductService } from '../../product/product.service';

describe('RecommendationsListener', () => {
  let listener: RecommendationsListener;
  let activityService: jest.Mocked<ActivityService>;
  let productService: jest.Mocked<ProductService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsListener,
        { provide: ActivityService, useValue: { recordPurchase: jest.fn() } },
        {
          provide: ProductService,
          useValue: {
            findVariantById: jest.fn().mockImplementation((id: number) =>
              Promise.resolve({ id, product_id: id + 100 }),
            ),
          },
        },
      ],
    }).compile();

    listener = module.get(RecommendationsListener);
    activityService = module.get(ActivityService);
    productService = module.get(ProductService);
  });

  it('logs a PURCHASE per item, resolving variant → product id', async () => {
    await listener.handleOrderCreated({
      orderId: 1,
      userId: 7,
      items: [
        { productVariantId: 10, quantity: 1 },
        { productVariantId: 20, quantity: 2 },
      ],
    });

    expect(activityService.recordPurchase).toHaveBeenCalledWith(7, 110);
    expect(activityService.recordPurchase).toHaveBeenCalledWith(7, 120);
  });

  it('skips entirely when the payload carries no userId (backward-compatible)', async () => {
    await listener.handleOrderCreated({
      orderId: 1,
      items: [{ productVariantId: 10, quantity: 1 }],
    });

    expect(productService.findVariantById).not.toHaveBeenCalled();
    expect(activityService.recordPurchase).not.toHaveBeenCalled();
  });

  it('skips an item whose variant no longer exists (lenient)', async () => {
    productService.findVariantById.mockResolvedValueOnce(null);

    await listener.handleOrderCreated({
      orderId: 1,
      userId: 7,
      items: [{ productVariantId: 999, quantity: 1 }],
    });

    expect(activityService.recordPurchase).not.toHaveBeenCalled();
  });
});
