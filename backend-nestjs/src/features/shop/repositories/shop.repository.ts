import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from '../entities/shop.entity';
import { Product } from '../../product/entities/product.entity';
import { ShopStatus } from '../../../common/constants';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IShopFilter {
  search?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

@Injectable()
export class ShopRepository {
  constructor(
    @InjectRepository(Shop)
    private readonly repo: Repository<Shop>,
  ) {}

  async findBySlug(slug: string): Promise<Shop | null> {
    return this.repo.findOne({ where: { slug, status: ShopStatus.Active } });
  }

  async findBySlugWithStats(slug: string): Promise<{
    shop: Shop;
    productCount: number;
    avgRating: number;
    totalSales: number;
  } | null> {
    const shop = await this.findBySlug(slug);
    if (!shop) return null;

    const stats = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(DISTINCT p.id)', 'productCount')
      .addSelect(
        'COALESCE(AVG(CAST(r.rating AS FLOAT)), 0)',
        'avgRating',
      )
      .addSelect(
        'COALESCE(SUM(oi.quantity), 0)',
        'totalSales',
      )
      .from('products', 'p')
      .leftJoin('reviews', 'r', 'r.product_id = p.id')
      .leftJoin('product_variants', 'pv', 'pv.product_id = p.id')
      .leftJoin('order_items', 'oi', 'oi.product_variant_id = pv.id')
      .where('p.shop_id = :shopId', { shopId: shop.id })
      .andWhere('p.is_active = :isActive', { isActive: true })
      .getRawOne();

    return {
      shop,
      productCount: parseInt(stats.productCount, 10),
      avgRating: parseFloat(stats.avgRating),
      totalSales: parseInt(stats.totalSales, 10),
    };
  }

  async findByUserId(userId: number): Promise<Shop | null> {
    return this.repo.findOne({ where: { user_id: userId } });
  }

  async findById(id: number): Promise<Shop | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActivePaginated(filter: IShopFilter): Promise<IPaginatedResult<Shop>> {
    const qb = this.repo
      .createQueryBuilder('shop')
      .where('shop.status = :status', { status: ShopStatus.Active });

    if (filter.search) {
      qb.andWhere('shop.name LIKE :search', { search: `%${filter.search}%` });
    }

    const sortColumn = filter.sort || 'created_at';
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`shop.${sortColumn}`, sortOrder);

    const total = await qb.getCount();
    const skip = (filter.page - 1) * filter.limit;
    const data = await qb.skip(skip).take(filter.limit).getMany();

    return {
      data,
      meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) },
    };
  }

  async findAllPaginated(filter: IShopFilter): Promise<IPaginatedResult<Shop>> {
    const qb = this.repo.createQueryBuilder('shop');

    if (filter.status) {
      qb.andWhere('shop.status = :status', { status: filter.status });
    }

    if (filter.search) {
      qb.andWhere('shop.name LIKE :search', { search: `%${filter.search}%` });
    }

    const sortColumn = filter.sort || 'created_at';
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`shop.${sortColumn}`, sortOrder);

    const total = await qb.getCount();
    const skip = (filter.page - 1) * filter.limit;
    const data = await qb.skip(skip).take(filter.limit).getMany();

    return {
      data,
      meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) },
    };
  }

  async create(data: Partial<Shop>): Promise<Shop> {
    const shop = this.repo.create(data);
    return this.repo.save(shop);
  }

  async update(id: number, data: Partial<Shop>): Promise<Shop | null> {
    await this.repo.update(id, { ...data, updated_at: new Date() });
    return this.findById(id);
  }

  async findActiveProductsByShopId(
    shopId: number,
    filter: IShopFilter,
  ): Promise<IPaginatedResult<Product>> {
    const productRepo = this.repo.manager.getRepository(Product);
    const qb = productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.shop_id = :shopId', { shopId })
      .andWhere('product.is_active = :isActive', { isActive: true });

    if (filter.search) {
      qb.andWhere('product.name LIKE :search', { search: `%${filter.search}%` });
    }

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

  async existsBySlug(slug: string): Promise<boolean> {
    return this.repo.exists({ where: { slug } });
  }
}
