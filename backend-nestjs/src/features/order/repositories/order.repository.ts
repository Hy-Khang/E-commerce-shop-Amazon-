import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderQueryDto } from '../dto/order-query.dto';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { OrderStatus } from '../../../common/constants';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async findByIdWithItems(id: number): Promise<Order | null> {
    return this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'items')
      .leftJoinAndSelect('items.product_variant', 'variant')
      .leftJoin('variant.product', 'product')
      .addSelect(['product.id', 'product.slug'])
      .leftJoin('product.shop', 'shop')
      .addSelect(['shop.id', 'shop.slug'])
      .where('order.id = :id', { id })
      .getOne();
  }

  async findByIdWithItemsAndUser(id: number): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['order_items', 'order_items.product_variant', 'user'],
    });
  }

  async findByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    sort = 'created_at',
    order: 'asc' | 'desc' = 'desc',
    status?: OrderStatus,
  ): Promise<IPaginatedResult<Order>> {
    const qb = this.repo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_items', 'items')
      .where('order.user_id = :userId', { userId });

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    qb.orderBy(`order.${sort}`, order.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllPaginated(
    query: OrderQueryDto,
  ): Promise<IPaginatedResult<Order>> {
    const qb = this.repo.createQueryBuilder('order');

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.payment_status) {
      qb.andWhere('order.payment_status = :paymentStatus', {
        paymentStatus: query.payment_status,
      });
    }

    if (query.user_id) {
      qb.andWhere('order.user_id = :userId', { userId: query.user_id });
    }

    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`order.${sort}`, order);

    const page = query.page || 1;
    const limit = query.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByShopIdPaginated(
    shopId: number,
    query: OrderQueryDto,
  ): Promise<IPaginatedResult<Order>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const sort = query.sort || 'created_at';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    const subQuery = this.repo
      .createQueryBuilder('o')
      .select('DISTINCT o.id')
      .innerJoin('o.order_items', 'oi', 'oi.shop_id = :shopId');

    const qb = this.repo
      .createQueryBuilder('order')
      .where(`order.id IN (${subQuery.getQuery()})`)
      .setParameters({ shopId });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.payment_status) {
      qb.andWhere('order.payment_status = :paymentStatus', {
        paymentStatus: query.payment_status,
      });
    }

    qb.orderBy(`order.${sort}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByIdWithItemsForShop(
    orderId: number,
    shopId: number,
  ): Promise<Order | null> {
    const order = await this.repo.findOne({
      where: { id: orderId },
      relations: ['order_items', 'order_items.product_variant', 'user'],
    });
    if (!order) return null;

    const hasShopItems = order.order_items.some((i) => i.shop_id === shopId);
    if (!hasShopItems) return null;

    return order;
  }

  async findByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<Order | null> {
    return this.repo.findOne({ where: { id, user_id: userId } });
  }

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.repo.create(data);
    return this.repo.save(order);
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }

  async updateStatusWithDeliveredAt(
    id: number,
    status: string,
    deliveredAt: Date,
  ): Promise<void> {
    await this.repo.update(id, { status, delivered_at: deliveredAt });
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<void> {
    await this.repo.update(id, { payment_status: paymentStatus });
  }

  async findExpiredDeliveredOrders(
    cutoff: Date,
  ): Promise<{ id: number; user_id: number }[]> {
    return this.repo
      .createQueryBuilder('order')
      .select(['order.id', 'order.user_id'])
      .where('order.status = :status', { status: OrderStatus.Delivered })
      .andWhere('order.delivered_at <= :cutoff', { cutoff })
      .getMany();
  }

  async bulkCompleteOrders(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .update(Order)
      .set({ status: OrderStatus.Completed })
      .whereInIds(ids)
      .execute();
  }
}
