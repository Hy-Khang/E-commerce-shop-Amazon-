import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
  OneToMany,
} from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permissions')
@Unique('uq_permissions_resource_action', ['resource', 'action'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 100 })
  name: string;

  @Index('idx_permissions_resource')
  @Column({ type: 'nvarchar', length: 50 })
  resource: string;

  @Column({ type: 'nvarchar', length: 50 })
  action: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  role_permissions: RolePermission[];
}
