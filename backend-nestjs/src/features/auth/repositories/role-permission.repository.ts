import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionRepository {
  constructor(
    @InjectRepository(RolePermission)
    private readonly repo: Repository<RolePermission>,
  ) {}

  async findByRoleId(roleId: number): Promise<RolePermission[]> {
    return this.repo.find({
      where: { role_id: roleId },
      relations: ['permission'],
    });
  }

  async findPermissionStringsByRoleId(roleId: number): Promise<string[]> {
    const results = await this.repo
      .createQueryBuilder('rp')
      .innerJoinAndSelect('rp.permission', 'permission')
      .where('rp.role_id = :roleId', { roleId })
      .getMany();

    return results.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
  }

  async syncPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await this.repo.delete({ role_id: roleId });

    if (permissionIds.length > 0) {
      const entities = permissionIds.map((permissionId) =>
        this.repo.create({ role_id: roleId, permission_id: permissionId }),
      );
      await this.repo.save(entities);
    }
  }

  async addPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const existing = await this.repo.find({
      where: { role_id: roleId, permission_id: In(permissionIds) },
    });
    const existingIds = new Set(existing.map((rp) => rp.permission_id));

    const newIds = permissionIds.filter((id) => !existingIds.has(id));
    if (newIds.length > 0) {
      const entities = newIds.map((permissionId) =>
        this.repo.create({ role_id: roleId, permission_id: permissionId }),
      );
      await this.repo.save(entities);
    }
  }

  async removePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await this.repo.delete({
      role_id: roleId,
      permission_id: In(permissionIds),
    });
  }
}
