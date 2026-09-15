import { Injectable } from '@nestjs/common';
import { UserActivityLogRepository } from './repositories/user-activity-log.repository';
import { RecommendationReasonService } from './recommendation-reason.service';
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

/** Weight per SEARCH-derived category hit — a weak signal, below a view. */
const SEARCH_CATEGORY_WEIGHT = 1;

/** Max points a candidate earns for category fit — scaled by preference strength. */
const CATEGORY_MAX = 3;
/** Half-life (days) for recency decay of interaction signals. */
const HALF_LIFE_DAYS = 30;
/** Best-seller pool fetched once for both tiebreak ranking and top-up filler. */
const BESTSELLER_RANK_POOL = 100;

/** Linear-interpolated percentile of an ascending-sorted array (p in [0,1]). */
function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 1) return sortedAsc[0];
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly activityLogRepository: UserActivityLogRepository,
    private readonly productService: ProductService,
    private readonly reasonService: RecommendationReasonService,
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

    const [interacted, viewedCategories, searchedCategories] =
      await Promise.all([
        this.activityLogRepository.getInteractedProducts(owner),
        this.activityLogRepository.getViewedCategories(owner),
        this.activityLogRepository.getSearchedCategories(owner),
      ]);

    const profile = this.buildProfile(
      interacted,
      viewedCategories,
      searchedCategories,
    );

    // Cold start — no signal at all → best-seller fallback, no reason.
    if (profile.categoryWeights.size === 0 && profile.priceMin === null) {
      const products = await this.getFallback(limit, new Set());
      return { reason: null, products };
    }

    const preferredCategories = [...profile.categoryWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_PREFERRED_CATEGORIES)
      .map(([categoryId]) => categoryId);

    // Fetch the best-seller pool once (only on the scoring path — the cold-start
    // and no-owner branches already returned). Reused for both the equal-score
    // tiebreak and the top-up filler, so best-sellers are queried a single time.
    const bestSellerIds =
      await this.activityLogRepository.getBestSellerProductIds(
        BESTSELLER_RANK_POOL,
      );
    const bestSellerRank = new Map<number, number>(
      bestSellerIds.map((id, i) => [id, i]),
    );

    const candidates =
      await this.activityLogRepository.getCandidatesByCategories(
        preferredCategories,
      );

    const scoredIds = this.scoreCandidates(
      candidates,
      profile,
      limit,
      bestSellerRank,
    );

    // Top up with best-sellers so the carousel is never sparse.
    const exclude = new Set<number>([
      ...profile.purchasedProductIds,
      ...profile.interactedProductIds,
      ...scoredIds,
    ]);
    let ids = [...scoredIds];
    if (ids.length < limit) {
      const filler = await this.getFallbackIds(limit * 2, exclude, bestSellerIds);
      ids = [...ids, ...filler].slice(0, limit);
    }

    const products = await this.hydrateOrdered(ids);
    const reason = await this.buildReason(profile.topCategoryId, products);
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
    searchedCategories: { categoryId: number; count: number }[] = [],
  ): UserProfile {
    const categoryWeights = new Map<number, number>();
    const shopWeights = new Map<number, number>();
    const purchasedProductIds = new Set<number>();
    const interactedProductIds = new Set<number>();
    const prices: number[] = [];

    for (const row of interacted) {
      // Recency decay: a recent signal counts more than an old one (half-life 30d).
      const decay = this.recencyDecay(row.createdAt);
      const weight = (ACTION_WEIGHT[row.action] ?? 1) * decay;
      if (row.categoryId != null) {
        categoryWeights.set(
          row.categoryId,
          (categoryWeights.get(row.categoryId) ?? 0) + weight,
        );
      }
      if (row.shopId != null) {
        shopWeights.set(row.shopId, (shopWeights.get(row.shopId) ?? 0) + decay);
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

    for (const { categoryId, count } of searchedCategories) {
      categoryWeights.set(
        categoryId,
        (categoryWeights.get(categoryId) ?? 0) + count * SEARCH_CATEGORY_WEIGHT,
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

    // Percentile-based price range (10–90) shrugs off a single outlier that raw
    // min/max would let widen the band to almost everything. Too few points to be
    // meaningful → fall back to raw min/max.
    let priceMin: number | null = null;
    let priceMax: number | null = null;
    if (prices.length > 0) {
      if (prices.length < 4) {
        priceMin = Math.min(...prices);
        priceMax = Math.max(...prices);
      } else {
        const sorted = [...prices].sort((a, b) => a - b);
        priceMin = percentile(sorted, 0.1);
        priceMax = percentile(sorted, 0.9);
      }
    }

    return {
      categoryWeights,
      shopWeights,
      priceMin,
      priceMax,
      purchasedProductIds,
      interactedProductIds,
      topCategoryId,
    };
  }

  /**
   * Recency decay factor for a signal's age — `0.5 ** (ageDays / HALF_LIFE_DAYS)`.
   * Missing/invalid timestamp or a future date → `1` (no decay), so candidate rows
   * and older callers that omit `createdAt` are unaffected.
   */
  private recencyDecay(createdAt?: Date | string | null): number {
    if (createdAt == null) return 1;
    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return 1;
    const ageDays = (Date.now() - t) / 86_400_000;
    if (ageDays <= 0) return 1;
    return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  }

  /**
   * Content-based scoring: category fit scaled by preference strength (up to
   * `CATEGORY_MAX`) · +2 price-in-range · +1 same shop. Equal scores are broken by
   * best-seller rank (a product outside the pool sorts last) so the order is stable
   * and popularity-sensible instead of arbitrary DB order.
   */
  private scoreCandidates(
    candidates: InteractedProduct[],
    profile: UserProfile,
    limit: number,
    bestSellerRank: Map<number, number>,
  ): number[] {
    // Normalize category weight → the dominant category earns the full CATEGORY_MAX,
    // weaker (but still preferred) categories earn proportionally less. Guard the
    // divisor so an empty weight map can never produce NaN.
    const maxCategoryWeight = Math.max(1, ...profile.categoryWeights.values());

    const scored: { id: number; score: number }[] = [];
    for (const c of candidates) {
      // Exclude already-purchased and already-interacted (surface fresh items).
      if (profile.purchasedProductIds.has(c.productId)) continue;
      if (profile.interactedProductIds.has(c.productId)) continue;

      let score = 0;
      if (c.categoryId != null && profile.categoryWeights.has(c.categoryId)) {
        const weight = profile.categoryWeights.get(c.categoryId) ?? 0;
        score += CATEGORY_MAX * (weight / maxCategoryWeight);
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

    const rankOf = (id: number) => bestSellerRank.get(id) ?? Number.POSITIVE_INFINITY;
    scored.sort((a, b) => b.score - a.score || rankOf(a.id) - rankOf(b.id));
    return scored.slice(0, limit).map((s) => s.id);
  }

  /**
   * Best-seller (then trending) product ids, excluding a set. An already-fetched
   * best-seller list may be passed in to avoid re-querying (the scoring path
   * fetches the pool once for tiebreak + top-up).
   */
  private async getFallbackIds(
    limit: number,
    exclude: Set<number>,
    preloadedBestSellers?: number[],
  ): Promise<number[]> {
    const bestSellers =
      preloadedBestSellers ??
      (await this.activityLogRepository.getBestSellerProductIds(limit * 2));
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

  /**
   * Reason label from the dominant category (matched to a hydrated product).
   * Delegates the copy to the reason service — AI-phrased when enabled, else the
   * deterministic rule-based fallback. `null` when the category can't be named.
   */
  private async buildReason(
    topCategoryId: number | null,
    products: Product[],
  ): Promise<string | null> {
    if (topCategoryId == null) return null;
    const match = products.find((p) => p.category?.id === topCategoryId);
    const name = match?.category?.name;
    if (!name) return null;
    return this.reasonService.describe(topCategoryId, name);
  }
}

export { PROFILE_WINDOW_DAYS };
