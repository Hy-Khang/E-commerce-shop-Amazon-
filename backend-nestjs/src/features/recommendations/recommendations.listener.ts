import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityService } from './activity.service';
import { ProductService } from '../product/product.service';
import { OrderCreatedEvent } from '../product/types/product.types';

/**
 * Hybrid PURCHASE capture: logs one PURCHASE activity row per purchased product
 * for the buyer when an order is placed. `order.created` is emitted per sub-order
 * (one per shop), so products across events are disjoint — no duplicate rows.
 * Best-effort: any failure is logged and swallowed (never affects the order flow),
 * consistent with NotificationListener.
 */
@Injectable()
export class RecommendationsListener {
  private readonly logger = new Logger(RecommendationsListener.name);

  constructor(
    private readonly activityService: ActivityService,
    private readonly productService: ProductService,
  ) {}

  @OnEvent('order.created')
  async handleOrderCreated(payload: OrderCreatedEvent): Promise<void> {
    if (!payload.userId) return; // no buyer id → nothing to attribute

    for (const item of payload.items) {
      try {
        const variant = await this.productService.findVariantById(
          item.productVariantId,
        );
        if (!variant) continue;
        await this.activityService.recordPurchase(
          payload.userId,
          variant.product_id,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to log PURCHASE for variant ${item.productVariantId}: ${(err as Error).message}`,
        );
      }
    }
  }
}
