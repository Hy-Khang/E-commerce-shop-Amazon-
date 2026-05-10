import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IProductFilter {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  is_active?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

@Injectable()
export class ProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findBySlug(slug: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { slug, is_active: true },
      relations: ['category', 'variants', 'images'],
    });
  }

  async findBySlugAdmin(slug: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { slug },
      relations: ['category', 'variants', 'images'],
    });
  }

  async findById(id: number): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['category', 'variants', 'images'],
    });
  }

  async findActivePaginated(filter: IProductFilter): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true });

    this.applyFilters(qb, filter);

    const sortColumn = filter.sort || 'created_at';
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`product.${sortColumn}`, sortOrder);

    const total = await qb.getCount();
    const skip = (filter.page - 1) * filter.limit;
    const data = await qb.skip(skip).take(filter.limit).getMany();

    return {
      data,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findAllPaginated(filter: IProductFilter): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category');

    if (filter.is_active !== undefined) {
      const isActive = filter.is_active === 'true';
      qb.andWhere('product.is_active = :isActive', { isActive });
    }

    this.applyFilters(qb, filter);

    const sortColumn = filter.sort || 'created_at';
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`product.${sortColumn}`, sortOrder);

    const total = await qb.getCount();
    const skip = (filter.page - 1) * filter.limit;
    const data = await qb.skip(skip).take(filter.limit).getMany();

    return {
      data,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findByIdWithReviewStats(id: number): Promise<Product & { reviewCount: number; avgRating: number } | null> {
    const product = await this.findById(id);
    if (!product) return null;

    const stats = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'reviewCount')
      .addSelect('COALESCE(AVG(CAST(r.rating AS FLOAT)), 0)', 'avgRating')
      .from('reviews', 'r')
      .where('r.product_id = :id', { id })
      .getRawOne();

    return Object.assign(product, {
      reviewCount: parseInt(stats.reviewCount, 10),
      avgRating: parseFloat(stats.avgRating),
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.repo.exists({ where: { slug } });
  }

  async existsBySlugExcludingId(slug: string, id: number): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('product')
      .where('product.slug = :slug AND product.id != :id', { slug, id })
      .getCount();
    return count > 0;
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: number, data: Partial<Product>): Promise<Product | null> {
    await this.repo.update(id, { ...data, updated_at: new Date() });
    return this.findById(id);
  }

  async updateIsActive(id: number, isActive: boolean): Promise<void> {
    await this.repo.update(id, { is_active: isActive, updated_at: new Date() });
  }

  async findProductsByCategoryId(
    categoryId: number,
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .where('product.category_id = :categoryId', { categoryId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.created_at', 'DESC');

    const total = await qb.getCount();
    const skip = (page - 1) * limit;
    const data = await qb.skip(skip).take(limit).getMany();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private applyFilters(qb: any, filter: IProductFilter): void {
    if (filter.search) {
      qb.andWhere('product.name LIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.category_id) {
      qb.andWhere('product.category_id = :categoryId', {
        categoryId: filter.category_id,
      });
    }

    if (filter.min_price !== undefined) {
      qb.andWhere('variant.price >= :minPrice', {
        minPrice: filter.min_price,
      });
    }

    if (filter.max_price !== undefined) {
      qb.andWhere('variant.price <= :maxPrice', {
        maxPrice: filter.max_price,
      });
    }
  }
}
