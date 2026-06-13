import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import type {
  IProductSummary,
  ITrendingProduct,
} from '../types/homepage.types';

@Injectable()
export class HomepageRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  private get mgr() {
    return this.repo.manager;
  }

  private mapProductRow(row: any): IProductSummary {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      thumbnailUrl: row.thumbnailUrl ?? null,
      price: parseFloat(row.price) || 0,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
      maxDiscountPercent: row.maxDiscountPercent
        ? parseFloat(row.maxDiscountPercent)
        : null,
      inStock: row.inStock === 1 || row.inStock === true,
    };
  }

  private buildProductAggregation(alias: string) {
    return [
      `${alias}.id AS id`,
      `${alias}.name AS name`,
      `${alias}.slug AS slug`,
      `${alias}.thumbnail_url AS thumbnailUrl`,
      `MIN(COALESCE(pv.sale_price, pv.price)) AS price`,
      `MIN(CASE WHEN pv.sale_price IS NOT NULL THEN pv.price ELSE NULL END) AS originalPrice`,
      `MAX(CASE WHEN pv.sale_price IS NOT NULL THEN ROUND((1.0 - pv.sale_price / pv.price) * 100, 0) ELSE NULL END) AS maxDiscountPercent`,
      `CASE WHEN SUM(pv.stock_quantity) > 0 THEN 1 ELSE 0 END AS inStock`,
    ];
  }

  async getSpecialOffers(limit: number): Promise<IProductSummary[]> {
    const rows = await this.mgr
      .createQueryBuilder()
      .select(this.buildProductAggregation('p'))
      .from('products', 'p')
      .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.is_active = 1')
      .andWhere("s.status = 'active'")
      .andWhere(
        'p.id IN (SELECT DISTINCT pv2.product_id FROM product_variants pv2 WHERE pv2.sale_price IS NOT NULL)',
      )
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.slug')
      .addGroupBy('p.thumbnail_url')
      .orderBy('maxDiscountPercent', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => this.mapProductRow(row));
  }

  async getBestSellers(limit: number): Promise<IProductSummary[]> {
    const rankRows = await this.mgr
      .createQueryBuilder()
      .select('pv.product_id', 'productId')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .from('order_items', 'oi')
      .innerJoin('product_variants', 'pv', 'pv.id = oi.product_variant_id')
      .innerJoin('orders', 'o', 'o.id = oi.order_id')
      .where("o.status IN ('delivered', 'completed')")
      .groupBy('pv.product_id')
      .orderBy('totalSold', 'DESC')
      .limit(limit * 2)
      .getRawMany();

    const productIds = rankRows.map((r) => r.productId);
    if (productIds.length === 0) return [];

    const rows = await this.mgr
      .createQueryBuilder()
      .select(this.buildProductAggregation('p'))
      .from('products', 'p')
      .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.is_active = 1')
      .andWhere("s.status = 'active'")
      .andWhere('p.id IN (:...productIds)', { productIds })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.slug')
      .addGroupBy('p.thumbnail_url')
      .getRawMany();

    const orderMap = new Map(productIds.map((id, i) => [id, i]));
    rows.sort(
      (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
    );

    return rows.slice(0, limit).map((row) => this.mapProductRow(row));
  }

  async getTrending(limit: number): Promise<ITrendingProduct[]> {
    const rankRows = await this.mgr
      .createQueryBuilder()
      .select('wi.product_id', 'productId')
      .addSelect('COUNT(*)', 'wishlistCount')
      .from('wishlist_items', 'wi')
      .where('wi.created_at >= DATEADD(DAY, -30, GETUTCDATE())')
      .groupBy('wi.product_id')
      .orderBy('wishlistCount', 'DESC')
      .limit(limit * 2)
      .getRawMany();

    const productIds = rankRows.map((r) => r.productId);
    if (productIds.length === 0) return [];

    const wishlistMap = new Map(
      rankRows.map((r) => [r.productId, parseInt(r.wishlistCount, 10)]),
    );

    const rows = await this.mgr
      .createQueryBuilder()
      .select(this.buildProductAggregation('p'))
      .from('products', 'p')
      .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.is_active = 1')
      .andWhere("s.status = 'active'")
      .andWhere('p.id IN (:...productIds)', { productIds })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.slug')
      .addGroupBy('p.thumbnail_url')
      .getRawMany();

    const orderMap = new Map(productIds.map((id, i) => [id, i]));
    rows.sort(
      (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
    );

    return rows.slice(0, limit).map((row) => ({
      ...this.mapProductRow(row),
      wishlistCount: wishlistMap.get(row.id) ?? 0,
    }));
  }

  async getDiscoverMore(limit: number): Promise<IProductSummary[]> {
    const today = new Date().toISOString().split('T')[0];

    const idRows = await this.mgr
      .createQueryBuilder()
      .select('p.id', 'id')
      .from('products', 'p')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.is_active = 1')
      .andWhere("s.status = 'active'")
      .orderBy(
        `CHECKSUM(CONCAT(CAST(p.id AS NVARCHAR), :dateString))`,
        'ASC',
      )
      .setParameter('dateString', today)
      .limit(limit)
      .getRawMany();

    const productIds = idRows.map((r) => r.id);
    if (productIds.length === 0) return [];

    const rows = await this.mgr
      .createQueryBuilder()
      .select(this.buildProductAggregation('p'))
      .from('products', 'p')
      .innerJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .innerJoin('shops', 's', 's.id = p.shop_id')
      .where('p.id IN (:...productIds)', { productIds })
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.slug')
      .addGroupBy('p.thumbnail_url')
      .getRawMany();

    const orderMap = new Map(productIds.map((id, i) => [id, i]));
    rows.sort(
      (a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999),
    );

    return rows.map((row) => this.mapProductRow(row));
  }
}
