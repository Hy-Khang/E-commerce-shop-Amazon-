import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.repo.find({ order: { resource: 'ASC', action: 'ASC' } });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.repo.find({ where: { resource }, order: { action: 'ASC' } });
  }

  async findById(id: number): Promise<Permission | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<Permission[]> {
    return this.repo.findByIds(ids);
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    return this.repo.findOne({ where: { resource, action } });
  }

  async create(data: Partial<Permission>): Promise<Permission> {
    const permission = this.repo.create(data);
    return this.repo.save(permission);
  }

  async update(
    id: number,
    data: Partial<Permission>,
  ): Promise<Permission | null> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async isAssignedToRoles(id: number): Promise<boolean> {
    const count = await this.repo
      .createQueryBuilder('permission')
      .innerJoin('permission.role_permissions', 'rp')
      .where('permission.id = :id', { id })
      .getCount();
    return count > 0;
  }
}
