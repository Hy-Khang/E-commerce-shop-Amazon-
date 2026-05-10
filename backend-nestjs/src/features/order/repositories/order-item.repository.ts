import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrderItemRepository {
  constructor(
    @InjectRepository(OrderItem)
    private readonly repo: Repository<OrderItem>,
  ) {}

  async createMany(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
    const entities = this.repo.create(items);
    return this.repo.save(entities);
  }

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    return this.repo.find({ where: { order_id: orderId } });
  }
}
