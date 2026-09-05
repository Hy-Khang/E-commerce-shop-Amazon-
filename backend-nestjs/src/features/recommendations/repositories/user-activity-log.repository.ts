import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import {
  ActivityAction,
  ActivityTargetType,
  InteractedProduct,
  RecommendationOwner,
} from '../types/recommendations.types';

const PROFILE_WINDOW_DAYS = 90;
const COMPLETED_STATUSES = "('delivered', 'completed')";

/**
 * All QueryBuilder for Smart Recommendations lives here (per BE feature rules —
 * the service orchestrates + scores in memory). Cross-table reads (products,
 * orders, order_items) use the injected repo's `manager` (the HomepageRepository
 * `.mgr` pattern), so no other feature's repository/entity is imported.
 */
@Injectable()
export class UserActivityLogRepository {
  constructor(
    @InjectRepository(UserActivityLog)
    private readonly repo: Repository<UserActivityLog>,
  ) {}

  private get mgr() {
    return this.repo.manager;
  }

  /** Insert one activity row (best-effort — caller swallows failures). */
  async record(row: {
    userId: number | null;
    sessionId: string | null;
    action: string;
    targetType: string;
    targetId: number | null;
    metadata: string | null;
  }): Promise<void> {
    await this.repo.insert({
      user_id: row.userId,
      session_id: row.sessionId,
      action: row.action,
      target_type: row.targetType,
      target_id: row.targetId,
      metadata: row.metadata,
    });
  }

  /** Apply the owner scope (`user_id` OR `session_id`) to a query builder. */
  private applyOwner(qb: any, owner: RecommendationOwner, alias = 'ual'): void {
    if (owner.userId != null) {
      qb.andWhere(`${alias}.user_id = :ownerUserId`, {
        ownerUserId: owner.userId,
      });
    } else {
      qb.andWhere(`${alias}.session_id = :ownerSessionId`, {
        ownerSessionId: owner.sessionId,
      });
    }
  }

  /**
   * One row per product interaction in the last 90 days, joined to the product's
   * category / shop / min price. PURCHASE rows are included and drive the
   * "already purchased" exclusion. Rows whose product was deleted are dropped by
   * the INNER JOIN (lenient — target_id is not a FK).
   */
  async getInteractedProducts(
    owner: RecommendationOwner,
  ): Promise<InteractedProduct[]> {
    const qb = this.mgr
      .createQueryBuilder()
      .select('ual.action', 'action')
      .addSelect('p.id', 'productId')
      .addSelect('p.category_id', 'categoryId')
      .addSelect('p.shop_id', 'shopId')
      .addSelect(
        '(SELECT MIN(COALESCE(pv.sale_price, pv.price)) FROM product_variants pv WHERE pv.product_id = p.id)',
        'price',
      )
      .from('user_activity_log', 'ual')
      .innerJoin('products', 'p', 'p.id = ual.target_id')
      .where('ual.target_type = :ptype', { ptype: ActivityTargetType.Product })
      .andWhere(
        `ual.created_at >= DATEADD(DAY, -${PROFILE_WINDOW_DAYS}, GETUTCDATE())`,
      );
    this.applyOwner(qb, owner);

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      action: r.action,
      productId: Number(r.productId),
      categoryId: r.categoryId != null ? Number(r.categoryId) : null,
      shopId: r.shopId != null ? Number(r.shopId) : null,
      price: r.price != null ? parseFloat(r.price) : null,
    }));
  }

  /** VIEW_CATEGORY signals — `target_id` is the category id directly. */
  async getViewedCategories(
    owner: RecommendationOwner,
  ): Promise<{ categoryId: number; count: number }[]> {
    const qb = this.mgr
      .createQueryBuilder()
      .select('ual.target_id', 'categoryId')
      .addSelect('COUNT(*)', 'cnt')
      .from('user_activity_log', 'ual')
      .where('ual.target_type = :ctype', { ctype: ActivityTargetType.Category })
      .andWhere('ual.action = :act', { act: ActivityAction.ViewCategory })
      .andWhere('ual.target_id IS NOT NULL')
      .andWhere(
        `ual.created_at >= DATEADD(DAY, -${PROFILE_WINDOW_DAYS}, GETUTCDATE())`,
      )
      .groupBy('ual.target_id');
    this.applyOwner(qb, owner);

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      categoryId: Number(r.categoryId),
      count: parseInt(r.cnt, 10),
    }));
  }

  /**
   * Candidate products (active, active shop) in the given categories — scored in
   * memory by the service. Returns each candidate's category / shop / min price.
   */
  async getCandidatesByCategories(
    categoryIds: number[],
  ): Promise<InteractedProduct[]> {
    if (categoryIds.length === 0) return [];
    const rows = await this.mgr
      .createQueryBuilder()
      .select('p.id', 'productId')
      .addSelect('p.category_id', 'categoryId')
      .addSelect('p.shop_id', 'shopId')
      .addSelect('MIN(COALESCE(pv.sale_price, pv.price))', 'price')
      .from('products', 'p')
      .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.is_active = 1')
      .andWhere("s.status = 'active'")
      .andWhere('p.category_id IN (:...categoryIds)', { categoryIds })
      .groupBy('p.id')
      .addGroupBy('p.category_id')
      .addGroupBy('p.shop_id')
      .getRawMany();

    return rows.map((r) => ({
      action: '',
      productId: Number(r.productId),
      categoryId: r.categoryId != null ? Number(r.categoryId) : null,
      shopId: r.shopId != null ? Number(r.shopId) : null,
      price: r.price != null ? parseFloat(r.price) : null,
    }));
  }

  /** Best-seller product ids ranked by units sold on completed orders. */
  async getBestSellerProductIds(limit: number): Promise<number[]> {
    const rows = await this.mgr
      .createQueryBuilder()
      .select('pv.product_id', 'productId')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .from('order_items', 'oi')
      .innerJoin('product_variants', 'pv', 'pv.id = oi.product_variant_id')
      .innerJoin('orders', 'o', 'o.id = oi.order_id')
      .where(`o.status IN ${COMPLETED_STATUSES}`)
      .groupBy('pv.product_id')
      .orderBy('totalSold', 'DESC')
      .limit(limit)
      .getRawMany();
    return rows.map((r) => Number(r.productId));
  }

  /** Trending product ids by wishlist adds in the last 30 days (secondary fallback). */
  async getTrendingProductIds(limit: number): Promise<number[]> {
    const rows = await this.mgr
      .createQueryBuilder()
      .select('wi.product_id', 'productId')
      .addSelect('COUNT(*)', 'wishlistCount')
      .from('wishlist_items', 'wi')
      .where('wi.created_at >= DATEADD(DAY, -30, GETUTCDATE())')
      .groupBy('wi.product_id')
      .orderBy('wishlistCount', 'DESC')
      .limit(limit)
      .getRawMany();
    return rows.map((r) => Number(r.productId));
  }

  /** The base product's category_id + min price (for content-similarity). */
  async getProductFacts(
    productId: number,
  ): Promise<{ categoryId: number | null; price: number | null } | null> {
    const row = await this.mgr
      .createQueryBuilder()
      .select('p.category_id', 'categoryId')
      .addSelect(
        '(SELECT MIN(COALESCE(pv.sale_price, pv.price)) FROM product_variants pv WHERE pv.product_id = p.id)',
        'price',
      )
      .from('products', 'p')
      .where('p.id = :productId', { productId })
      .getRawOne();
    if (!row) return null;
    return {
      categoryId: row.categoryId != null ? Number(row.categoryId) : null,
      price: row.price != null ? parseFloat(row.price) : null,
    };
  }

  /**
   * Content-similar product ids: same category (fallback to sibling categories
   * under the same parent), active product + active shop, excluding self.
   * Ranked by price proximity to the base product's min price.
   */
  async getContentSimilarIds(
    productId: number,
    categoryId: number,
    basePrice: number | null,
    limit: number,
  ): Promise<number[]> {
    const run = async (catIds: number[]): Promise<number[]> => {
      if (catIds.length === 0) return [];
      const qb = this.mgr
        .createQueryBuilder()
        .select('p.id', 'productId')
        .addSelect('MIN(COALESCE(pv.sale_price, pv.price))', 'price')
        .from('products', 'p')
        .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
        .innerJoin('shops', 's', 's.id = p.shop_id')
        .where('p.is_active = 1')
        .andWhere("s.status = 'active'")
        .andWhere('p.id <> :productId', { productId })
        .andWhere('p.category_id IN (:...catIds)', { catIds })
        .groupBy('p.id');
      const rows = await qb.getRawMany();
      const withPrice = rows.map((r) => ({
        id: Number(r.productId),
        price: r.price != null ? parseFloat(r.price) : null,
      }));
      if (basePrice != null) {
        withPrice.sort(
          (a, b) =>
            Math.abs((a.price ?? Infinity) - basePrice) -
            Math.abs((b.price ?? Infinity) - basePrice),
        );
      }
      return withPrice.slice(0, limit).map((r) => r.id);
    };

    // Same category first.
    let ids = await run([categoryId]);
    if (ids.length >= limit) return ids;

    // Broaden to sibling categories under the same parent.
    const siblingRows = await this.mgr
      .createQueryBuilder()
      .select('c2.id', 'id')
      .from('categories', 'c1')
      .innerJoin(
        'categories',
        'c2',
        '(c2.parent_id = c1.parent_id OR c2.parent_id = c1.id)',
      )
      .where('c1.id = :categoryId', { categoryId })
      .getRawMany();
    const catIds = Array.from(
      new Set<number>([categoryId, ...siblingRows.map((r) => Number(r.id))]),
    );
    ids = await run(catIds);
    return ids;
  }

  /**
   * Co-view ids: products viewed by owners who also viewed `:productId`,
   * ranked by co-occurrence. Self-join on user_id OR session_id.
   */
  async getCoViewedIds(productId: number, limit: number): Promise<number[]> {
    const rows = await this.mgr
      .createQueryBuilder()
      .select('other.target_id', 'productId')
      .addSelect('COUNT(*)', 'cnt')
      .from('user_activity_log', 'me')
      .innerJoin(
        'user_activity_log',
        'other',
        `((me.user_id IS NOT NULL AND me.user_id = other.user_id)
          OR (me.session_id IS NOT NULL AND me.session_id = other.session_id))
         AND other.target_type = 'product'
         AND other.action = 'VIEW_PRODUCT'
         AND other.target_id <> :productId`,
      )
      .where("me.target_type = 'product'")
      .andWhere("me.action = 'VIEW_PRODUCT'")
      .andWhere('me.target_id = :productId', { productId })
      .andWhere('other.target_id IS NOT NULL')
      .groupBy('other.target_id')
      .orderBy('cnt', 'DESC')
      .limit(limit)
      .getRawMany();
    return rows.map((r) => Number(r.productId));
  }

  /**
   * Co-purchase ids: products bought in the same checkout group as `:productId`
   * on completed orders, ranked by co-occurrence.
   */
  async getCoPurchasedIds(productId: number, limit: number): Promise<number[]> {
    const rows = await this.mgr
      .createQueryBuilder()
      .select('pv2.product_id', 'productId')
      .addSelect('COUNT(*)', 'cnt')
      .from('order_items', 'oi1')
      .innerJoin('product_variants', 'pv1', 'pv1.id = oi1.product_variant_id')
      .innerJoin('orders', 'o1', 'o1.id = oi1.order_id')
      .innerJoin('orders', 'o2', 'o2.order_group_id = o1.order_group_id')
      .innerJoin('order_items', 'oi2', 'oi2.order_id = o2.id')
      .innerJoin('product_variants', 'pv2', 'pv2.id = oi2.product_variant_id')
      .where('pv1.product_id = :productId', { productId })
      .andWhere('pv2.product_id <> :productId', { productId })
      .andWhere(`o1.status IN ${COMPLETED_STATUSES}`)
      .andWhere(`o2.status IN ${COMPLETED_STATUSES}`)
      .groupBy('pv2.product_id')
      .orderBy('cnt', 'DESC')
      .limit(limit)
      .getRawMany();
    return rows.map((r) => Number(r.productId));
  }

  /** Delete rows older than `days` (cleanup cron). Returns affected count. */
  async deleteOlderThan(days: number): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(UserActivityLog)
      .where(`created_at < DATEADD(DAY, -${days}, GETUTCDATE())`)
      .execute();
    return result.affected ?? 0;
  }
}
