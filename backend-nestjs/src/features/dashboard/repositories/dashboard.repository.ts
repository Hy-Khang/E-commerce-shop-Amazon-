import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import type {
  ISummaryStats,
  IRevenueDataPoint,
  IOrderStatusCount,
  IRecentOrder,
  IUserRoleCount,
  ITopProduct,
  ILowStockAlert,
  IAttentionSignals,
  ITopShop,
  ISellerSummaryStats,
  ISellerRecentOrder,
  IShipperSummaryStats,
  IShipperDeliveryDataPoint,
  IShipperRecentDelivery,
} from '../types/dashboard.types';
import { computeChange, type RevenueGranularity } from '../utils/period.util';

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async getSummaryStats(days: number): Promise<ISummaryStats> {
    const mgr = this.repo.manager;

    // Current window: [now-days, now]; previous window: [now-2*days, now-days].
    // Both computed in a single scan via conditional SUM.
    const CUR = 'o.created_at >= DATEADD(DAY, :curStart, GETUTCDATE())';
    const PREV =
      'o.created_at >= DATEADD(DAY, :prevStart, GETUTCDATE()) AND o.created_at < DATEADD(DAY, :curStart, GETUTCDATE())';

    const [flowResult, productResult, userResult] = await Promise.all([
      mgr
        .createQueryBuilder()
        .from('orders', 'o')
        .select(
          `COALESCE(SUM(CASE WHEN o.status = 'completed' AND ${CUR} THEN o.total_amount END), 0)`,
          'curGross',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status = 'completed' AND ${PREV} THEN o.total_amount END), 0)`,
          'prevGross',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status = 'completed' AND o.payment_status = 'paid' AND ${CUR} THEN o.total_amount END), 0)`,
          'curCollected',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status = 'completed' AND o.payment_status = 'paid' AND ${PREV} THEN o.total_amount END), 0)`,
          'prevCollected',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status <> 'cancelled' AND ${CUR} THEN 1 ELSE 0 END), 0)`,
          'curOrders',
        )
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status <> 'cancelled' AND ${PREV} THEN 1 ELSE 0 END), 0)`,
          'prevOrders',
        )
        .where('o.created_at >= DATEADD(DAY, :prevStart, GETUTCDATE())')
        .setParameters({ curStart: -days, prevStart: -2 * days })
        .getRawOne(),
      mgr
        .createQueryBuilder()
        .select('COUNT(*)', 'totalProducts')
        .from('products', 'p')
        .where('p.is_active = 1')
        .getRawOne(),
      mgr
        .createQueryBuilder()
        .select('COUNT(*)', 'totalUsers')
        .from('users', 'u')
        .where('u.is_active = 1')
        .getRawOne(),
    ]);

    const curGross = parseFloat(flowResult.curGross) || 0;
    const prevGross = parseFloat(flowResult.prevGross) || 0;
    const curCollected = parseFloat(flowResult.curCollected) || 0;
    const prevCollected = parseFloat(flowResult.prevCollected) || 0;
    const curOrders = parseInt(flowResult.curOrders, 10) || 0;
    const prevOrders = parseInt(flowResult.prevOrders, 10) || 0;

    return {
      grossRevenue: curGross,
      grossRevenueChange: computeChange(curGross, prevGross),
      collectedRevenue: curCollected,
      collectedRevenueChange: computeChange(curCollected, prevCollected),
      totalOrders: curOrders,
      totalOrdersChange: computeChange(curOrders, prevOrders),
      totalProducts: parseInt(productResult.totalProducts, 10),
      totalUsers: parseInt(userResult.totalUsers, 10),
    };
  }

  async getRevenueOverTime(
    days: number,
    granularity: RevenueGranularity = 'day',
  ): Promise<IRevenueDataPoint[]> {
    return this.queryRevenueOverTime(days, granularity, null);
  }

  /**
   * Revenue trend bucketed by day (short ranges) or calendar month (12m).
   * Monthly buckets group on CONVERT(varchar(7), created_at, 126) → 'yyyy-MM'
   * and are returned as 'yyyy-MM-01' so the frontend parses them as dates.
   * When `shopId` is provided the revenue is the shop's share (order_items).
   */
  private async queryRevenueOverTime(
    days: number,
    granularity: RevenueGranularity,
    shopId: number | null,
  ): Promise<IRevenueDataPoint[]> {
    const isMonth = granularity === 'month';
    const bucketExpr = isMonth
      ? "CONVERT(varchar(7), o.created_at, 126)"
      : 'CAST(o.created_at AS DATE)';
    const revenueExpr = shopId
      ? 'COALESCE(SUM(oi.price * oi.quantity), 0)'
      : 'COALESCE(SUM(o.total_amount), 0)';

    const qb = this.repo.manager.createQueryBuilder();

    if (shopId) {
      qb.from('order_items', 'oi').innerJoin(
        'orders',
        'o',
        'oi.order_id = o.id',
      );
    } else {
      qb.from('orders', 'o');
    }

    qb.select(bucketExpr, 'bucket')
      .addSelect(revenueExpr, 'revenue')
      .where("o.payment_status = 'paid'")
      .andWhere("o.status = 'completed'")
      .andWhere('o.created_at >= DATEADD(DAY, :days, GETUTCDATE())', {
        days: -days,
      });

    if (shopId) {
      qb.andWhere('o.shop_id = :shopId', { shopId });
    }

    const rows = await qb
      .groupBy(bucketExpr)
      .orderBy('bucket', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      let date: string;
      if (isMonth) {
        // 'yyyy-MM' → 'yyyy-MM-01'
        date = `${String(row.bucket)}-01`;
      } else {
        date =
          row.bucket instanceof Date
            ? row.bucket.toISOString().split('T')[0]
            : String(row.bucket);
      }
      return { date, revenue: parseFloat(row.revenue) || 0 };
    });
  }

  async getAttentionSignals(): Promise<IAttentionSignals> {
    const mgr = this.repo.manager;

    const [pendingShopsResult, returnRequestedResult] = await Promise.all([
      mgr
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('shops', 's')
        .where("s.status = 'pending_verification'")
        .getRawOne(),
      mgr
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('orders', 'o')
        .where("o.status = 'return_requested'")
        .getRawOne(),
    ]);

    return {
      pendingShops: parseInt(pendingShopsResult.count, 10) || 0,
      returnRequestedOrders: parseInt(returnRequestedResult.count, 10) || 0,
    };
  }

  async getTopShops(limit: number): Promise<ITopShop[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        's.id AS id',
        's.name AS name',
        's.slug AS slug',
        'COALESCE(SUM(oi.price * oi.quantity), 0) AS revenue',
        'COUNT(DISTINCT o.id) AS orderCount',
      ])
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .innerJoin('shops', 's', 'o.shop_id = s.id')
      .where("o.payment_status = 'paid'")
      .andWhere("o.status = 'completed'")
      .groupBy('s.id')
      .addGroupBy('s.name')
      .addGroupBy('s.slug')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      revenue: parseFloat(row.revenue) || 0,
      orderCount: parseInt(row.orderCount, 10) || 0,
    }));
  }

  async getOrdersByStatus(): Promise<IOrderStatusCount[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .from('orders', 'o')
      .groupBy('o.status')
      .getRawMany();

    return rows.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
    }));
  }

  async getRecentOrders(limit: number): Promise<IRecentOrder[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'o.id AS id',
        'u.full_name AS customerName',
        'o.status AS status',
        'o.payment_status AS paymentStatus',
        'o.total_amount AS totalAmount',
        'o.created_at AS createdAt',
      ])
      .from('orders', 'o')
      .innerJoin('users', 'u', 'o.user_id = u.id')
      .orderBy('o.created_at', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      status: row.status,
      paymentStatus: row.paymentStatus,
      totalAmount: parseFloat(row.totalAmount) || 0,
      createdAt: row.createdAt,
    }));
  }

  async getUsersByRole(): Promise<IUserRoleCount[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select('r.name', 'role')
      .addSelect('COUNT(u.id)', 'count')
      .from('roles', 'r')
      .leftJoin('users', 'u', 'u.role_id = r.id AND u.is_active = 1')
      .groupBy('r.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map((row) => ({
      role: row.role,
      count: parseInt(row.count, 10),
    }));
  }

  async getTopProducts(limit: number): Promise<ITopProduct[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.thumbnail_url AS thumbnailUrl',
        'SUM(oi.quantity) AS totalOrdered',
        'SUM(oi.price * oi.quantity) AS totalRevenue',
      ])
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .innerJoin('product_variants', 'pv', 'oi.product_variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .where("o.payment_status = 'paid'")
      .andWhere("o.status = 'completed'")
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.thumbnail_url')
      .orderBy('totalOrdered', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      thumbnailUrl: row.thumbnailUrl,
      totalOrdered: parseInt(row.totalOrdered, 10),
      totalRevenue: parseFloat(row.totalRevenue) || 0,
    }));
  }

  async getLowStockAlerts(threshold: number): Promise<ILowStockAlert[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'pv.id AS id',
        'p.name AS productName',
        'pv.sku AS sku',
        'pv.option1 AS option1',
        'pv.option2 AS option2',
        'pv.stock_quantity AS stockQuantity',
      ])
      .from('product_variants', 'pv')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .where('pv.stock_quantity < :threshold', { threshold })
      .andWhere('p.is_active = 1')
      .orderBy('pv.stock_quantity', 'ASC')
      .limit(20)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      productName: row.productName,
      sku: row.sku,
      option1: row.option1,
      option2: row.option2,
      stockQuantity: parseInt(row.stockQuantity, 10),
    }));
  }

  async getSellerSummaryStats(
    shopId: number,
    days: number,
  ): Promise<ISellerSummaryStats> {
    const mgr = this.repo.manager;

    const CUR = 'o.created_at >= DATEADD(DAY, :curStart, GETUTCDATE())';
    const PREV =
      'o.created_at >= DATEADD(DAY, :prevStart, GETUTCDATE()) AND o.created_at < DATEADD(DAY, :curStart, GETUTCDATE())';

    const [flowResult, orderResult, productResult, lowStockResult] =
      await Promise.all([
        mgr
          .createQueryBuilder()
          .from('order_items', 'oi')
          .innerJoin('orders', 'o', 'oi.order_id = o.id')
          .select(
            `COALESCE(SUM(CASE WHEN o.status = 'completed' AND ${CUR} THEN oi.price * oi.quantity END), 0)`,
            'curGross',
          )
          .addSelect(
            `COALESCE(SUM(CASE WHEN o.status = 'completed' AND ${PREV} THEN oi.price * oi.quantity END), 0)`,
            'prevGross',
          )
          .addSelect(
            `COALESCE(SUM(CASE WHEN o.status = 'completed' AND o.payment_status = 'paid' AND ${CUR} THEN oi.price * oi.quantity END), 0)`,
            'curCollected',
          )
          .addSelect(
            `COALESCE(SUM(CASE WHEN o.status = 'completed' AND o.payment_status = 'paid' AND ${PREV} THEN oi.price * oi.quantity END), 0)`,
            'prevCollected',
          )
          .where('o.shop_id = :shopId')
          .andWhere('o.created_at >= DATEADD(DAY, :prevStart, GETUTCDATE())')
          .setParameters({ shopId, curStart: -days, prevStart: -2 * days })
          .getRawOne(),
        mgr
          .createQueryBuilder()
          .from('orders', 'o')
          .select(
            `COALESCE(SUM(CASE WHEN o.status <> 'cancelled' AND ${CUR} THEN 1 ELSE 0 END), 0)`,
            'curOrders',
          )
          .addSelect(
            `COALESCE(SUM(CASE WHEN o.status <> 'cancelled' AND ${PREV} THEN 1 ELSE 0 END), 0)`,
            'prevOrders',
          )
          .where('o.shop_id = :shopId')
          .andWhere('o.created_at >= DATEADD(DAY, :prevStart, GETUTCDATE())')
          .setParameters({ shopId, curStart: -days, prevStart: -2 * days })
          .getRawOne(),
        mgr
          .createQueryBuilder()
          .select('COUNT(*)', 'totalProducts')
          .from('products', 'p')
          .where('p.shop_id = :shopId', { shopId })
          .andWhere('p.is_active = 1')
          .getRawOne(),
        mgr
          .createQueryBuilder()
          .select('COUNT(*)', 'lowStockCount')
          .from('product_variants', 'pv')
          .innerJoin('products', 'p', 'pv.product_id = p.id')
          .where('p.shop_id = :shopId', { shopId })
          .andWhere('p.is_active = 1')
          .andWhere('pv.stock_quantity < :threshold', { threshold: 10 })
          .getRawOne(),
      ]);

    const curGross = parseFloat(flowResult.curGross) || 0;
    const prevGross = parseFloat(flowResult.prevGross) || 0;
    const curCollected = parseFloat(flowResult.curCollected) || 0;
    const prevCollected = parseFloat(flowResult.prevCollected) || 0;
    const curOrders = parseInt(orderResult.curOrders, 10) || 0;
    const prevOrders = parseInt(orderResult.prevOrders, 10) || 0;

    return {
      grossRevenue: curGross,
      grossRevenueChange: computeChange(curGross, prevGross),
      collectedRevenue: curCollected,
      collectedRevenueChange: computeChange(curCollected, prevCollected),
      totalOrders: curOrders,
      totalOrdersChange: computeChange(curOrders, prevOrders),
      totalProducts: parseInt(productResult.totalProducts, 10),
      lowStockCount: parseInt(lowStockResult.lowStockCount, 10),
    };
  }

  async getSellerRevenueOverTime(
    shopId: number,
    days: number,
    granularity: RevenueGranularity = 'day',
  ): Promise<IRevenueDataPoint[]> {
    return this.queryRevenueOverTime(days, granularity, shopId);
  }

  async getSellerTopProducts(
    shopId: number,
    limit: number,
  ): Promise<ITopProduct[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'p.id AS id',
        'p.name AS name',
        'p.thumbnail_url AS thumbnailUrl',
        'SUM(oi.quantity) AS totalOrdered',
        'SUM(oi.price * oi.quantity) AS totalRevenue',
      ])
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .innerJoin('product_variants', 'pv', 'oi.product_variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .where('o.shop_id = :shopId', { shopId })
      .andWhere("o.payment_status = 'paid'")
      .andWhere("o.status = 'completed'")
      .groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('p.thumbnail_url')
      .orderBy('totalOrdered', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      thumbnailUrl: row.thumbnailUrl,
      totalOrdered: parseInt(row.totalOrdered, 10),
      totalRevenue: parseFloat(row.totalRevenue) || 0,
    }));
  }

  async getSellerRecentOrders(
    shopId: number,
    limit: number,
  ): Promise<ISellerRecentOrder[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'o.id AS id',
        'u.full_name AS customerName',
        'o.status AS status',
        'o.payment_status AS paymentStatus',
        'SUM(oi.price * oi.quantity) AS sellerSubtotal',
        'o.created_at AS createdAt',
      ])
      .from('order_items', 'oi')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .innerJoin('users', 'u', 'o.user_id = u.id')
      .where('o.shop_id = :shopId', { shopId })
      .groupBy('o.id')
      .addGroupBy('u.full_name')
      .addGroupBy('o.status')
      .addGroupBy('o.payment_status')
      .addGroupBy('o.created_at')
      .orderBy('o.created_at', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      customerName: row.customerName,
      status: row.status,
      paymentStatus: row.paymentStatus,
      sellerSubtotal: parseFloat(row.sellerSubtotal) || 0,
      createdAt: row.createdAt,
    }));
  }

  async getSellerLowStockAlerts(
    shopId: number,
    threshold: number,
  ): Promise<ILowStockAlert[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'pv.id AS id',
        'p.name AS productName',
        'pv.sku AS sku',
        'pv.option1 AS option1',
        'pv.option2 AS option2',
        'pv.stock_quantity AS stockQuantity',
      ])
      .from('product_variants', 'pv')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .where('p.shop_id = :shopId', { shopId })
      .andWhere('p.is_active = 1')
      .andWhere('pv.stock_quantity < :threshold', { threshold })
      .orderBy('pv.stock_quantity', 'ASC')
      .limit(20)
      .getRawMany();

    return rows.map((row) => ({
      id: row.id,
      productName: row.productName,
      sku: row.sku,
      option1: row.option1,
      option2: row.option2,
      stockQuantity: parseInt(row.stockQuantity, 10),
    }));
  }

  // ─── Shipper dashboard ───

  async getShipperSummaryStats(
    shipperId: number,
  ): Promise<IShipperSummaryStats> {
    const mgr = this.repo.manager;

    const result = await mgr
      .createQueryBuilder()
      .select([
        `SUM(CASE WHEN status IN ('delivered','completed') THEN 1 ELSE 0 END) AS totalDelivered`,
        `SUM(CASE WHEN status = 'shipping' THEN 1 ELSE 0 END) AS activeDeliveries`,
        `(SELECT COUNT(*) FROM orders WHERE status = 'confirmed' AND shipper_id IS NULL) AS availableForPickup`,
        `SUM(CASE WHEN status IN ('delivered','completed') AND CAST(delivered_at AS DATE) = CAST(GETUTCDATE() AS DATE) THEN 1 ELSE 0 END) AS deliveredToday`,
      ])
      .from('orders', 'o')
      .where('o.shipper_id = :shipperId', { shipperId })
      .getRawOne();

    return {
      totalDelivered: parseInt(result.totalDelivered, 10) || 0,
      activeDeliveries: parseInt(result.activeDeliveries, 10) || 0,
      availableForPickup: parseInt(result.availableForPickup, 10) || 0,
      deliveredToday: parseInt(result.deliveredToday, 10) || 0,
    };
  }

  async getShipperDeliveriesOverTime(
    shipperId: number,
    days: number = 30,
  ): Promise<IShipperDeliveryDataPoint[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select('CAST(o.delivered_at AS DATE)', 'date')
      .addSelect('COUNT(*)', 'count')
      .from('orders', 'o')
      .where('o.shipper_id = :shipperId', { shipperId })
      .andWhere("o.status IN ('delivered','completed')")
      .andWhere('o.delivered_at >= DATEADD(DAY, :days, GETUTCDATE())', {
        days: -days,
      })
      .groupBy('CAST(o.delivered_at AS DATE)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split('T')[0]
          : String(row.date),
      count: parseInt(row.count, 10) || 0,
    }));
  }

  async getShipperRecentDeliveries(
    shipperId: number,
    limit: number = 10,
  ): Promise<IShipperRecentDelivery[]> {
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select([
        'o.id AS id',
        'o.status AS status',
        'o.total_amount AS totalAmount',
        'o.shipping_address AS shippingAddress',
        'o.created_at AS createdAt',
        'o.delivered_at AS deliveredAt',
      ])
      .from('orders', 'o')
      .where('o.shipper_id = :shipperId', { shipperId })
      .orderBy('o.created_at', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => {
      let customerName = 'Unknown';
      try {
        const addr = JSON.parse(row.shippingAddress);
        customerName = addr.full_name || 'Unknown';
      } catch {}

      return {
        id: row.id,
        customerName,
        status: row.status,
        totalAmount: parseFloat(row.totalAmount) || 0,
        shippingAddress: row.shippingAddress,
        createdAt: row.createdAt,
        deliveredAt: row.deliveredAt ?? null,
      };
    });
  }
}
