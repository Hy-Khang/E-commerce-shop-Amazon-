import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderTrackingLocation } from '../entities/order-tracking-location.entity';

@Injectable()
export class OrderTrackingLocationRepository {
  constructor(
    @InjectRepository(OrderTrackingLocation)
    private readonly repo: Repository<OrderTrackingLocation>,
  ) {}

  async insertLocation(
    orderId: number,
    latitude: number,
    longitude: number,
  ): Promise<OrderTrackingLocation> {
    const entry = this.repo.create({
      order_id: orderId,
      latitude,
      longitude,
    });
    return this.repo.save(entry);
  }

  async findLatestByOrderId(
    orderId: number,
  ): Promise<OrderTrackingLocation | null> {
    return this.repo
      .createQueryBuilder('loc')
      .where('loc.order_id = :orderId', { orderId })
      .orderBy('loc.created_at', 'DESC')
      .getOne();
  }

  async findAllByOrderId(orderId: number): Promise<OrderTrackingLocation[]> {
    return this.repo
      .createQueryBuilder('loc')
      .where('loc.order_id = :orderId', { orderId })
      .orderBy('loc.created_at', 'ASC')
      .getMany();
  }
}
