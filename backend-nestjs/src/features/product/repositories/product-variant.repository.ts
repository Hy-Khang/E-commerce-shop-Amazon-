import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductVariantRepository {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly repo: Repository<ProductVariant>,
  ) {}

  async findById(id: number): Promise<ProductVariant | null> {
    return this.repo.findOne({ where: { id }, relations: ['product'] });
  }

  async findByProductId(productId: number): Promise<ProductVariant[]> {
    return this.repo.find({ where: { product_id: productId } });
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async existsBySku(sku: string): Promise<boolean> {
    return this.repo.exists({ where: { sku } });
  }

  async existsBySkuExcludingId(sku: string, id: number): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('variant')
      .where('variant.sku = :sku AND variant.id != :id', { sku, id })
      .getCount();
    return count > 0;
  }

  async hasActiveCartItems(id: number): Promise<boolean> {
    const count = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('cart_items', 'ci')
      .where('ci.product_variant_id = :id', { id })
      .getRawOne()
      .then((r) => parseInt(r.count, 10));
    return count > 0;
  }

  async create(data: Partial<ProductVariant>): Promise<ProductVariant> {
    const variant = this.repo.create(data);
    return this.repo.save(variant);
  }

  async update(id: number, data: Partial<ProductVariant>): Promise<ProductVariant | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async deductStock(variantId: number, quantity: number): Promise<boolean> {
    const result = await this.repo
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ stock_quantity: () => `stock_quantity - ${quantity}` })
      .where('id = :id AND stock_quantity >= :qty', {
        id: variantId,
        qty: quantity,
      })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  async restoreStock(variantId: number, quantity: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(ProductVariant)
      .set({ stock_quantity: () => `stock_quantity + ${quantity}` })
      .where('id = :id', { id: variantId })
      .execute();
  }
}
