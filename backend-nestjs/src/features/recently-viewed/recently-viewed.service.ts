import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RecentlyViewedRepository } from './repositories/recently-viewed.repository';
import { ProductService } from '../product/product.service';
import { MergeRecentlyViewedDto } from './dto/merge-recently-viewed.dto';
import { Product } from '../product/entities/product.entity';

const RECENTLY_VIEWED_LIMIT = 20;

@Injectable()
export class RecentlyViewedService {
  private readonly logger = new Logger(RecentlyViewedService.name);

  constructor(
    private readonly recentlyViewedRepository: RecentlyViewedRepository,
    private readonly productService: ProductService,
  ) {}

  /** Record a product view for the user (UPSERT + trim to the newest 20). */
  async recordView(userId: number, productId: number): Promise<void> {
    const product = await this.productService.findProductByIdPublic(productId);
    if (!product || !product.is_active) {
      throw new NotFoundException({
        code: 'PRODUCT_001',
        message: 'Product not found or inactive',
      });
    }

    await this.recentlyViewedRepository.upsertView(userId, productId);
    await this.recentlyViewedRepository.pruneToLimit(
      userId,
      RECENTLY_VIEWED_LIMIT,
    );
  }

  /** The user's recently-viewed products, newest first (visibility-filtered). */
  async getRecentlyViewed(userId: number): Promise<Product[]> {
    const ids = await this.recentlyViewedRepository.findTopProductIds(
      userId,
      RECENTLY_VIEWED_LIMIT,
    );
    return this.hydrateOrdered(ids);
  }

  /** Merge a guest's localStorage history into the user's DB history. */
  async merge(userId: number, dto: MergeRecentlyViewedDto): Promise<Product[]> {
    const items = dto.items.map((i) => ({
      product_id: i.product_id,
      viewed_at: new Date(i.viewed_at),
    }));

    if (items.length > 0) {
      await this.recentlyViewedRepository.bulkUpsert(userId, items);
      await this.recentlyViewedRepository.pruneToLimit(
        userId,
        RECENTLY_VIEWED_LIMIT,
      );
      this.logger.log(
        `Merged ${items.length} recently-viewed item(s) for user ${userId}`,
      );
    }

    return this.getRecentlyViewed(userId);
  }

  /** Hydrate active products for the ids and preserve the recency order. */
  private async hydrateOrdered(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const products = await this.productService.findActiveByIds(ids);
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is Product => p != null);
  }
}
