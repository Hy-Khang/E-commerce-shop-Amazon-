import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/product-image.entity';

@Injectable()
export class ProductImageRepository {
  constructor(
    @InjectRepository(ProductImage)
    private readonly repo: Repository<ProductImage>,
  ) {}

  async findById(id: number): Promise<ProductImage | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByProductId(productId: number): Promise<ProductImage[]> {
    return this.repo.find({
      where: { product_id: productId },
      order: { sort_order: 'ASC' },
    });
  }

  async create(data: Partial<ProductImage>): Promise<ProductImage> {
    const image = this.repo.create(data);
    return this.repo.save(image);
  }

  async updateSortOrder(id: number, sortOrder: number): Promise<ProductImage | null> {
    await this.repo.update(id, { sort_order: sortOrder });
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
