import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { ShopStatus } from '../../../common/constants';
import { ProductSortBy } from '../dto/product-query.dto';

export interface IProductFilter {
  search?: string;
  category_id?: number;
  category_ids?: number[];
  ids?: number[];
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  shop_id?: number;
  in_stock?: string;
  is_active?: string;
  globalSearch?: boolean;
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
    return this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.slug = :slug', { slug })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .getOne();
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
      relations: ['category', 'variants', 'images', 'shop'],
    });
  }

  async findActivePaginated(filter: IProductFilter): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.is_active = :isActive', { isActive: true });

    this.applyFilters(qb, { ...filter, globalSearch: true });
    this.applySorting(qb, filter);

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

  /** Active products (active shop only) for a set of ids — no pagination, no ordering. */
  async findActiveByIds(ids: number[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    return this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.id IN (:...ids)', { ids })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .getMany();
  }

  /**
   * Active products (active shop only) for a set of ids, each enriched with review
   * stats (`avgRating` + `reviewCount`). Powers the bulk `?ids=` path used by product
   * comparison. Stats are fetched in one grouped query (batched, no N+1).
   */
  async findActiveByIdsWithStats(
    ids: number[],
  ): Promise<(Product & { reviewCount: number; avgRating: number })[]> {
    if (ids.length === 0) return [];

    const products = await this.findActiveByIds(ids);
    if (products.length === 0) return [];

    const statsRows = await this.repo.manager
      .createQueryBuilder()
      .select('r.product_id', 'productId')
      .addSelect('COUNT(*)', 'reviewCount')
      .addSelect('COALESCE(AVG(CAST(r.rating AS FLOAT)), 0)', 'avgRating')
      .from('reviews', 'r')
      .where('r.product_id IN (:...ids)', { ids: products.map((p) => p.id) })
      .groupBy('r.product_id')
      .getRawMany<{ productId: number; reviewCount: string; avgRating: string }>();

    const statsMap = new Map(
      statsRows.map((s) => [
        Number(s.productId),
        { reviewCount: parseInt(s.reviewCount, 10), avgRating: parseFloat(s.avgRating) },
      ]),
    );

    return products.map((p) =>
      Object.assign(p, statsMap.get(p.id) ?? { reviewCount: 0, avgRating: 0 }),
    );
  }

  async findAllPaginated(filter: IProductFilter): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.shop', 'shop');

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

  async findProductsByCategoryIds(
    categoryIds: number[],
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .innerJoin('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.category_id IN (:...categoryIds)', { categoryIds })
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

  async findAllByShopPaginated(shopId: number, filter: IProductFilter): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.shop_id = :shopId', { shopId });

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

  async findByIdAndShop(id: number, shopId: number): Promise<Product | null> {
    return this.repo.findOne({
      where: { id, shop_id: shopId },
      relations: ['category', 'variants', 'images'],
    });
  }

  // ─── Search Suggestions ───

  async suggestProducts(query: string, limit: number): Promise<{ name: string; slug: string; thumbnail_url: string | null }[]> {
    return this.repo
      .createQueryBuilder('product')
      .select(['product.name', 'product.slug', 'product.thumbnail_url'])
      .innerJoin('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.name LIKE :q', { q: `%${query}%` })
      .orderBy('product.name', 'ASC')
      .limit(limit)
      .getMany();
  }

  async suggestCategories(query: string, limit: number): Promise<{ name: string; slug: string }[]> {
    return this.repo.manager
      .createQueryBuilder()
      .select(['c.name AS name', 'c.slug AS slug'])
      .from('categories', 'c')
      .where('c.name LIKE :q', { q: `%${query}%` })
      .orderBy('c.name', 'ASC')
      .limit(limit)
      .getRawMany();
  }

  // ─── Visual Search ───

  async findByVisualAttributes(
    attrs: { category?: string; color?: string; material?: string; style?: string; keywords?: string[] },
    page: number,
    limit: number,
  ): Promise<IPaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variant')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .innerJoinAndSelect('product.shop', 'shop', 'shop.status = :shopStatus', { shopStatus: ShopStatus.Active })
      .where('product.is_active = :isActive', { isActive: true });

    const orClauses: string[] = [];
    const scoreExprs: string[] = [];
    const params: Record<string, any> = {};

    if (attrs.category) {
      params.vsCat = `%${attrs.category}%`;
      orClauses.push('category.name LIKE :vsCat');
      scoreExprs.push('CASE WHEN category.name LIKE :vsCat THEN 5 ELSE 0 END');
    }

    if (attrs.color) {
      params.vsColor = `%${attrs.color}%`;
      orClauses.push(
        `product.id IN (SELECT pv_c.product_id FROM product_variants pv_c WHERE pv_c.option1 LIKE :vsColor OR pv_c.option2 LIKE :vsColor)`,
      );
      scoreExprs.push(
        `CASE WHEN product.id IN (SELECT pv_c2.product_id FROM product_variants pv_c2 WHERE pv_c2.option1 LIKE :vsColor OR pv_c2.option2 LIKE :vsColor) THEN 3 ELSE 0 END`,
      );
    }

    const textTerms = [
      ...(attrs.keywords || []),
      ...(attrs.material ? [attrs.material] : []),
      ...(attrs.style ? [attrs.style] : []),
    ];

    textTerms.forEach((term, i) => {
      params[`vsT${i}`] = `%${term}%`;
      orClauses.push(`(product.name LIKE :vsT${i} OR product.description LIKE :vsT${i})`);
      scoreExprs.push(
        `CASE WHEN product.name LIKE :vsT${i} THEN 2 WHEN product.description LIKE :vsT${i} THEN 1 ELSE 0 END`,
      );
    });

    if (orClauses.length === 0) {
      return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    }

    qb.andWhere(`(${orClauses.join(' OR ')})`, params);

    if (scoreExprs.length > 0) {
      qb.addSelect(`(${scoreExprs.join(' + ')})`, 'vs_score');
      qb.orderBy('vs_score', 'DESC');
    }

    const total = await qb.getCount();
    const skip = (page - 1) * limit;
    const data = await qb.skip(skip).take(limit).getMany();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Private ───

  private applyFilters(qb: SelectQueryBuilder<Product>, filter: IProductFilter): void {
    if (filter.search) {
      if (filter.globalSearch) {
        qb.andWhere(
          '(product.name LIKE :search OR product.description LIKE :search OR category.name LIKE :search OR shop.name LIKE :search)',
          { search: `%${filter.search}%` },
        );
      } else {
        qb.andWhere('product.name LIKE :search', {
          search: `%${filter.search}%`,
        });
      }
    }

    if (filter.ids && filter.ids.length > 0) {
      qb.andWhere('product.id IN (:...ids)', { ids: filter.ids });
    }

    if (filter.category_ids && filter.category_ids.length > 0) {
      qb.andWhere('product.category_id IN (:...categoryIds)', {
        categoryIds: filter.category_ids,
      });
    } else if (filter.category_id) {
      qb.andWhere('product.category_id = :categoryId', {
        categoryId: filter.category_id,
      });
    }

    if (filter.min_price !== undefined) {
      qb.andWhere(
        `product.id IN (SELECT pv_price.product_id FROM product_variants pv_price WHERE COALESCE(pv_price.sale_price, pv_price.price) >= :minPrice)`,
        { minPrice: filter.min_price },
      );
    }

    if (filter.max_price !== undefined) {
      qb.andWhere(
        `product.id IN (SELECT pv_price2.product_id FROM product_variants pv_price2 WHERE COALESCE(pv_price2.sale_price, pv_price2.price) <= :maxPrice)`,
        { maxPrice: filter.max_price },
      );
    }

    if (filter.min_rating !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM reviews r WHERE r.product_id = product.id GROUP BY r.product_id HAVING AVG(CAST(r.rating AS FLOAT)) >= :minRating)`,
        { minRating: filter.min_rating },
      );
    }

    if (filter.shop_id !== undefined) {
      qb.andWhere('product.shop_id = :shopId', { shopId: filter.shop_id });
    }

    if (filter.in_stock === 'true') {
      qb.andWhere(
        `product.id IN (SELECT pv_stock.product_id FROM product_variants pv_stock GROUP BY pv_stock.product_id HAVING SUM(pv_stock.stock_quantity) > 0)`,
      );
    }
  }

  private applySorting(qb: SelectQueryBuilder<Product>, filter: IProductFilter): void {
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    switch (filter.sort) {
      case ProductSortBy.Price:
        qb.addSelect(
          `(SELECT MIN(COALESCE(pv_s.sale_price, pv_s.price)) FROM product_variants pv_s WHERE pv_s.product_id = product.id)`,
          'min_price_sort',
        );
        qb.orderBy('min_price_sort', sortOrder);
        break;

      case ProductSortBy.BestSelling:
        qb.addSelect(
          `(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id INNER JOIN product_variants pv_bs ON pv_bs.id = oi.product_variant_id WHERE pv_bs.product_id = product.id AND o.status IN ('delivered', 'completed'))`,
          'total_sold_sort',
        );
        qb.orderBy('total_sold_sort', sortOrder);
        break;

      case ProductSortBy.Rating:
        qb.addSelect(
          `(SELECT COALESCE(AVG(CAST(r.rating AS FLOAT)), 0) FROM reviews r WHERE r.product_id = product.id)`,
          'avg_rating_sort',
        );
        qb.orderBy('avg_rating_sort', sortOrder);
        break;

      case ProductSortBy.Name:
        qb.orderBy('product.name', sortOrder);
        break;

      case ProductSortBy.CreatedAt:
        qb.orderBy('product.created_at', sortOrder);
        break;

      default:
        if (filter.search && filter.globalSearch) {
          qb.addSelect(
            `CASE
              WHEN product.name LIKE :exactSearch THEN 1
              WHEN product.name LIKE :search THEN 2
              WHEN product.description LIKE :search THEN 3
              WHEN category.name LIKE :search THEN 4
              WHEN shop.name LIKE :search THEN 5
              ELSE 6
            END`,
            'relevance_score',
          );
          qb.setParameter('exactSearch', filter.search);
          qb.setParameter('search', `%${filter.search}%`);
          qb.orderBy('relevance_score', 'ASC');
        } else {
          qb.orderBy('product.created_at', 'DESC');
        }
        break;
    }
  }
}
