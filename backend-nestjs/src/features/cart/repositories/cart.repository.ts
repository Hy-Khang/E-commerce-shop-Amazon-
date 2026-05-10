import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly repo: Repository<Cart>,
  ) {}

  async findByUserId(userId: number): Promise<Cart | null> {
    return this.repo.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product_variant', 'items.product_variant.product'],
    });
  }

  async findBySessionId(sessionId: string): Promise<Cart | null> {
    return this.repo.findOne({
      where: { session_id: sessionId },
      relations: ['items', 'items.product_variant', 'items.product_variant.product'],
    });
  }

  async create(data: Partial<Cart>): Promise<Cart> {
    const cart = this.repo.create(data);
    return this.repo.save(cart);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
