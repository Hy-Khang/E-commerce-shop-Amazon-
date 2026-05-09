import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  async findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  async findById(id: number): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Role[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findAllWithUserCount(): Promise<(Role & { userCount: number })[]> {
    return this.repo
      .createQueryBuilder('role')
      .loadRelationCountAndMap('role.userCount', 'role.users')
      .orderBy('role.id', 'ASC')
      .getMany() as Promise<(Role & { userCount: number })[]>;
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
    const role = this.repo.create(data);
    return this.repo.save(role);
  }

  async update(id: number, data: Partial<Role>): Promise<Role | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
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
