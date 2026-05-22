import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderQueryDto } from '../dto/order-query.dto';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  async findByIdWithItems(id: number): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['order_items', 'order_items.product_variant'],
    });
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
  ): Promise<IPaginatedResult<Order>> {
    const [data, total] = await this.repo.findAndCount({
      where: { user_id: userId },
      order: { [sort]: order.toUpperCase() },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async create(data: Partial<Order>): Promise<Order> {
    const order = this.repo.create(data);
    return this.repo.save(order);
  }

  async updateStatus(id: number, status: string): Promise<void> {
    await this.repo.update(id, { status });
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<void> {
    await this.repo.update(id, { payment_status: paymentStatus });
  }
}
