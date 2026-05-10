import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface ICategoryFilter {
  search?: string;
  parent_id?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  async findTree(): Promise<Category[]> {
    return this.repo.find({
      where: { parent_id: undefined },
      relations: ['children', 'children.children'],
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.repo.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });
  }

  async findById(id: number): Promise<Category | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  async findAllPaginated(filter: ICategoryFilter): Promise<IPaginatedResult<Category>> {
    const qb = this.repo
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products');

    if (filter.search) {
      qb.andWhere('category.name LIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.parent_id !== undefined) {
      qb.andWhere('category.parent_id = :parentId', {
        parentId: filter.parent_id,
      });
    }

    const sortColumn = filter.sort || 'name';
    const sortOrder = (filter.order || 'asc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`category.${sortColumn}`, sortOrder);

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

  async findByIdWithDetails(id: number): Promise<Category | null> {
    const category = await this.repo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .loadRelationCountAndMap('category.productCount', 'category.products')
      .where('category.id = :id', { id })
      .getOne();

    return category;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.repo.exists({ where: { slug } });
  }

  async existsBySlugExcludingId(slug: string, id: number): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('category')
      .where('category.slug = :slug AND category.id != :id', { slug, id })
      .getCount();
    return count > 0;
  }

  async hasProductsOrChildren(id: number): Promise<boolean> {
    const childCount = await this.repo.count({ where: { parent_id: id } });
    if (childCount > 0) return true;

    const productCount = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('products', 'p')
      .where('p.category_id = :id', { id })
      .getRawOne()
      .then((r) => parseInt(r.count, 10));

    return productCount > 0;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.repo.create(data);
    return this.repo.save(category);
  }

  async update(id: number, data: Partial<Category>): Promise<Category | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
