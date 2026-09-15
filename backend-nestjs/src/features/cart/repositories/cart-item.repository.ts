import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class CartItemRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly repo: Repository<CartItem>,
  ) {}

  async findById(id: number): Promise<CartItem | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['product_variant', 'product_variant.product'],
    });
  }

  async findByCartAndVariant(
    cartId: number,
    productVariantId: number,
  ): Promise<CartItem | null> {
    return this.repo.findOne({
      where: { cart_id: cartId, product_variant_id: productVariantId },
    });
  }

  async create(data: Partial<CartItem>): Promise<CartItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async updateQuantity(id: number, quantity: number): Promise<CartItem | null> {
    await this.repo.update(id, { quantity });
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async deleteByCartId(cartId: number, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(CartItem) : this.repo;
    await repo.delete({ cart_id: cartId });
  }
}
