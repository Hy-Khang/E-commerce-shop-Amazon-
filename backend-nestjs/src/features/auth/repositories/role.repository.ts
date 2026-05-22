import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) { }

  async findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findAll(): Promise<Role[]> {
    return this.repo.query('EXEC sp_GetAllRoles');
  }
  async findById(id: number): Promise<Role | null> {
    const result = await this.repo.query('EXEC sp_GetRoleById @id = @0', [id]);
    return result[0] || null;
  }
  async findAllWithUserCount(): Promise<(Role & { userCount: number })[]> {
    return this.repo.query('EXEC sp_GetRolesWithUserCount');
  }

  async findByIdWithUserCount(id: number): Promise<(Role & { userCount: number }) | null> {
    const result = await this.repo
      .createQueryBuilder('role')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .where('role.id = :id', { id })
      .getOne();
    return result as (Role & { userCount: number }) | null;
  }

  async create(data: Partial<Role>): Promise<Role> {
    const result = await this.repo.query('EXEC sp_CreateRole @name = @0', [data.name]);
    return result[0];
  }
  async update(id: number, data: Partial<Role>): Promise<Role | null> {
    const result = await this.repo.query('EXEC sp_UpdateRole @id = @0, @name = @1', [id, data.name]);
    return result[0];
  }
  async delete(id: number): Promise<void> {
    await this.repo.query('EXEC sp_DeleteRole @id = @0', [id]);
  }

  async existsByName(name: string): Promise<boolean> {
    return this.repo.exists({ where: { name } });
  }

  async hasUsers(id: number): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('role')
      .innerJoin('role.users', 'user')
      .where('role.id = :id', { id })
      .getCount();
    return count > 0;
  }
}
