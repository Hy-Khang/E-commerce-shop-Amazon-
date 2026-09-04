import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { IPaginatedResult } from '../../../common/interfaces/paginated-result.interface';

export interface IAdminUserFilter {
  search?: string;
  role?: string;
  is_active?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/** Defensive allowlist — sort is interpolated into the query, never trust raw input. */
const USER_SORT_COLUMNS = new Set(['created_at', 'email', 'full_name']);

function resolveUserSortColumn(sort?: string): string {
  return sort && USER_SORT_COLUMNS.has(sort) ? sort : 'created_at';
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email }, relations: ['role'] });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['role'] });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repo.exists({ where: { email } });
  }

  async findAllPaginated(
    filter: IAdminUserFilter,
  ): Promise<IPaginatedResult<User>> {
    const qb = this.repo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role');

    if (filter.search) {
      qb.andWhere('(user.email LIKE :search OR user.full_name LIKE :search)', {
        search: `%${filter.search}%`,
      });
    }

    if (filter.role) {
      qb.andWhere('role.name = :role', { role: filter.role });
    }

    if (filter.is_active !== undefined) {
      const isActive = filter.is_active === 'true';
      qb.andWhere('user.is_active = :isActive', { isActive });
    }

    const sortColumn = resolveUserSortColumn(filter.sort);
    const sortOrder = (filter.order || 'desc').toUpperCase() as 'ASC' | 'DESC';
    qb.orderBy(`user.${sortColumn}`, sortOrder);

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

  async findByIdWithStats(
    id: number,
  ): Promise<(User & { orderCount: number; reviewCount: number }) | null> {
    const user = await this.repo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.role', 'role')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) return null;

    const orderCount = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('orders', 'o')
      .where('o.user_id = :id', { id })
      .getRawOne()
      .then((r) => parseInt(r.count, 10));

    const reviewCount = await this.repo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('reviews', 'r')
      .where('r.user_id = :id', { id })
      .getRawOne()
      .then((r) => parseInt(r.count, 10));

    return Object.assign(user, { orderCount, reviewCount });
  }

  async updateIsActive(id: number, isActive: boolean): Promise<void> {
    await this.repo.update(id, { is_active: isActive });
  }

  async updateRoleId(id: number, roleId: number): Promise<void> {
    await this.repo.update(id, { role_id: roleId });
  }

  async updateProfile(
    id: number,
    data: { full_name?: string; phone?: string },
  ): Promise<User | null> {
    await this.repo.update(id, { ...data, updated_at: new Date() });
    return this.repo.findOne({ where: { id }, relations: ['role'] });
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.repo.findOne({
      where: { password_reset_token_hash: tokenHash },
      relations: ['role'],
    });
  }

  async save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
