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
} from '../types/dashboard.types';

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async getSummaryStats(): Promise<ISummaryStats> {
    const mgr = this.repo.manager;

    const [revenueResult, orderResult, productResult, userResult] =
      await Promise.all([
        mgr
          .createQueryBuilder()
          .select('COALESCE(SUM(total_amount), 0)', 'totalRevenue')
          .from('orders', 'o')
          .where("o.payment_status = 'paid'")
          .andWhere("o.status != 'cancelled'")
          .getRawOne(),
        mgr
          .createQueryBuilder()
          .select('COUNT(*)', 'totalOrders')
          .from('orders', 'o')
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

    return {
      totalRevenue: parseFloat(revenueResult.totalRevenue) || 0,
      totalOrders: parseInt(orderResult.totalOrders, 10),
      totalProducts: parseInt(productResult.totalProducts, 10),
      totalUsers: parseInt(userResult.totalUsers, 10),
    };
  }

  async getRevenueOverTime(days: number): Promise<IRevenueDataPoint[]> {
    // SQL Server: CAST(created_at AS DATE) for date grouping
    const rows = await this.repo.manager
      .createQueryBuilder()
      .select('CAST(o.created_at AS DATE)', 'date')
      .addSelect('COALESCE(SUM(o.total_amount), 0)', 'revenue')
      .from('orders', 'o')
      .where("o.payment_status = 'paid'")
      .andWhere("o.status != 'cancelled'")
      .andWhere('o.created_at >= DATEADD(DAY, :days, GETUTCDATE())', {
        days: -days,
      })
      .groupBy('CAST(o.created_at AS DATE)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split('T')[0]
          : String(row.date),
      revenue: parseFloat(row.revenue) || 0,
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
      .andWhere("o.status != 'cancelled'")
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
}
