import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatusHistory } from '../entities/order-status-history.entity';

@Injectable()
export class OrderStatusHistoryRepository {
  constructor(
    @InjectRepository(OrderStatusHistory)
    private readonly repo: Repository<OrderStatusHistory>,
  ) {}

  async createEntry(data: {
    orderId: number;
    fromStatus: string | null;
    toStatus: string;
    actorId?: number | null;
    actorType: string;
    note?: string | null;
  }): Promise<OrderStatusHistory> {
    const entry = this.repo.create({
      order_id: data.orderId,
      from_status: data.fromStatus,
      to_status: data.toStatus,
      actor_id: data.actorId ?? null,
      actor_type: data.actorType,
      note: data.note ?? null,
    });
    return this.repo.save(entry);
  }

  async findByOrderId(orderId: number): Promise<OrderStatusHistory[]> {
    return this.repo
      .createQueryBuilder('h')
      .leftJoin('h.actor', 'actor')
      .addSelect(['actor.id', 'actor.full_name'])
      .where('h.order_id = :orderId', { orderId })
      .orderBy('h.created_at', 'ASC')
      .getMany();
  }
}
