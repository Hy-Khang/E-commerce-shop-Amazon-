import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
@Unique('uq_role_permissions_role_permission', ['role_id', 'permission_id'])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_role_permissions_role_id')
  @Column()
  role_id: number;

  @Index('idx_role_permissions_permission_id')
  @Column()
  permission_id: number;

  @ManyToOne(() => Role, (role) => role.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.role_permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
