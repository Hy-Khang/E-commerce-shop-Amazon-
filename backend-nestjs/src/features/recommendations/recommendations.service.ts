import { Injectable } from '@nestjs/common';
import { UserActivityLogRepository } from './repositories/user-activity-log.repository';
import { ProductService } from '../product/product.service';
import { Product } from '../product/entities/product.entity';
import {
  ActivityAction,
  InteractedProduct,
  RecommendationOwner,
  UserProfile,
} from './types/recommendations.types';

const DEFAULT_LIMIT = 12;
const MAX_PREFERRED_CATEGORIES = 8;
const PROFILE_WINDOW_DAYS = 90; // kept in sync with the repository window

/** Action → weight when building the preferred-category profile. */
const ACTION_WEIGHT: Record<string, number> = {
  [ActivityAction.Purchase]: 5,
  [ActivityAction.AddToCart]: 3,
  [ActivityAction.AddToWishlist]: 2,
  [ActivityAction.ViewProduct]: 1,
  [ActivityAction.ViewCategory]: 1,
};

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly activityLogRepository: UserActivityLogRepository,
    private readonly productService: ProductService,
  ) {}

  /** "Recommended for You" — personalized set + a reason label (null on fallback). */
  async getRecommendations(
    owner: RecommendationOwner | null,
    limit = DEFAULT_LIMIT,
  ): Promise<{ reason: string | null; products: Product[] }> {
    // No identity (guest without x-session-id) → best-seller fallback.
    if (!owner) {
      const products = await this.getFallback(limit, new Set());
      return { reason: null, products };
    }

    const [interacted, viewedCategories] = await Promise.all([
      this.activityLogRepository.getInteractedProducts(owner),
      this.activityLogRepository.getViewedCategories(owner),
    ]);

    const profile = this.buildProfile(interacted, viewedCategories);

    // Cold start — no signal at all → best-seller fallback, no reason.
    if (profile.categoryWeights.size === 0 && profile.priceMin === null) {
      const products = await this.getFallback(limit, new Set());
      return { reason: null, products };
    }

    const preferredCategories = [...profile.categoryWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_PREFERRED_CATEGORIES)
      .map(([categoryId]) => categoryId);

    const candidates =
      await this.activityLogRepository.getCandidatesByCategories(
        preferredCategories,
      );

    const scoredIds = this.scoreCandidates(candidates, profile, limit);

    // Top up with best-sellers so the carousel is never sparse.
    const exclude = new Set<number>([
      ...profile.purchasedProductIds,
      ...scoredIds,
    ]);
    let ids = [...scoredIds];
    if (ids.length < limit) {
      const filler = await this.getFallbackIds(limit * 2, exclude);
      ids = [...ids, ...filler].slice(0, limit);
    }

    const products = await this.hydrateOrdered(ids);
    const reason = this.buildReason(profile.topCategoryId, products);
    return { reason, products: products.slice(0, limit) };
  }

  /** "Similar Products" — content similarity blended with co-view behavior. */
  async getSimilar(productId: number, limit = DEFAULT_LIMIT): Promise<Product[]> {
    const facts = await this.activityLogRepository.getProductFacts(productId);

    const [coView, contentSimilar] = await Promise.all([
      this.activityLogRepository.getCoViewedIds(productId, limit),
      facts?.categoryId != null
        ? this.activityLogRepository.getContentSimilarIds(
            productId,
            facts.categoryId,
            facts.price,
            limit,
          )
        : Promise.resolve<number[]>([]),
    ]);

    // Co-view first, fill with content-similar; dedup + drop self.
    const seen = new Set<number>([productId]);
    const blended: number[] = [];
    for (const id of [...coView, ...contentSimilar]) {
      if (seen.has(id)) continue;
      seen.add(id);
      blended.push(id);
      if (blended.length >= limit) break;
    }

    const products = await this.hydrateOrdered(blended);
    if (products.length > 0) return products;

    // Sparse → best-seller fallback (excluding self).
    return this.getFallback(limit, new Set([productId]));
  }

  /** "Frequently Bought Together" — co-purchase, falls back to Similar. */
  async getFrequentlyBoughtTogether(
    productId: number,
    limit = DEFAULT_LIMIT,
  ): Promise<Product[]> {
    const coPurchasedIds = await this.activityLogRepository.getCoPurchasedIds(
      productId,
      limit,
    );
    const products = await this.hydrateOrdered(coPurchasedIds);
    if (products.length > 0) return products;

    // Sparse co-purchase data → fall back to Similar.
    return this.getSimilar(productId, limit);
  }

  // ─── internals ───

  private buildProfile(
    interacted: InteractedProduct[],
    viewedCategories: { categoryId: number; count: number }[],
  ): UserProfile {
    const categoryWeights = new Map<number, number>();
    const shopWeights = new Map<number, number>();
    const purchasedProductIds = new Set<number>();
    const interactedProductIds = new Set<number>();
    const prices: number[] = [];

    for (const row of interacted) {
      const weight = ACTION_WEIGHT[row.action] ?? 1;
      if (row.categoryId != null) {
        categoryWeights.set(
          row.categoryId,
          (categoryWeights.get(row.categoryId) ?? 0) + weight,
        );
      }
      if (row.shopId != null) {
        shopWeights.set(row.shopId, (shopWeights.get(row.shopId) ?? 0) + 1);
      }
      if (row.price != null) prices.push(row.price);
      interactedProductIds.add(row.productId);
      if (row.action === ActivityAction.Purchase) {
        purchasedProductIds.add(row.productId);
      }
    }

    for (const { categoryId, count } of viewedCategories) {
      categoryWeights.set(
        categoryId,
        (categoryWeights.get(categoryId) ?? 0) +
          count * ACTION_WEIGHT[ActivityAction.ViewCategory],
      );
    }

    let topCategoryId: number | null = null;
    let topWeight = -1;
    for (const [categoryId, weight] of categoryWeights) {
      if (weight > topWeight) {
        topWeight = weight;
        topCategoryId = categoryId;
      }
    }

    return {
      categoryWeights,
      shopWeights,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      purchasedProductIds,
      interactedProductIds,
      topCategoryId,
    };
  }

  /** Content-based scoring: +3 category · +2 price-in-range · +1 same shop. */
  private scoreCandidates(
    candidates: InteractedProduct[],
    profile: UserProfile,
    limit: number,
  ): number[] {
    const scored: { id: number; score: number }[] = [];
    for (const c of candidates) {
      // Exclude already-purchased and already-interacted (surface fresh items).
      if (profile.purchasedProductIds.has(c.productId)) continue;
      if (profile.interactedProductIds.has(c.productId)) continue;

      let score = 0;
      if (c.categoryId != null && profile.categoryWeights.has(c.categoryId)) {
        score += 3;
      }
      if (
        c.price != null &&
        profile.priceMin != null &&
        profile.priceMax != null &&
        c.price >= profile.priceMin &&
        c.price <= profile.priceMax
      ) {
        score += 2;
      }
      if (c.shopId != null && profile.shopWeights.has(c.shopId)) {
        score += 1;
      }
      if (score > 0) scored.push({ id: c.productId, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.id);
  }

  /** Best-seller (then trending) product ids, excluding a set. */
  private async getFallbackIds(
    limit: number,
    exclude: Set<number>,
  ): Promise<number[]> {
    const bestSellers =
      await this.activityLogRepository.getBestSellerProductIds(limit * 2);
    let ids = bestSellers.filter((id) => !exclude.has(id));

    if (ids.length < limit) {
      const trending =
        await this.activityLogRepository.getTrendingProductIds(limit * 2);
      for (const id of trending) {
        if (!exclude.has(id) && !ids.includes(id)) ids.push(id);
      }
    }
    return ids.slice(0, limit);
  }

  /** Hydrated best-seller/trending fallback products. */
  private async getFallback(
    limit: number,
    exclude: Set<number>,
  ): Promise<Product[]> {
    const ids = await this.getFallbackIds(limit, exclude);
    const products = await this.hydrateOrdered(ids);
    return products.slice(0, limit);
  }

  /** Hydrate active products for ids, preserving the ranked order. */
  private async hydrateOrdered(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    const products = await this.productService.findActiveByIdsWithStats(ids);
    type Hydrated = (typeof products)[number];
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is Hydrated => p != null);
  }

  /** Reason label from the dominant category (matched to a hydrated product). */
  private buildReason(
    topCategoryId: number | null,
    products: Product[],
  ): string | null {
    if (topCategoryId == null) return null;
    const match = products.find((p) => p.category?.id === topCategoryId);
    const name = match?.category?.name;
    return name ? `Because you like ${name}` : null;
  }
}

export { PROFILE_WINDOW_DAYS };
