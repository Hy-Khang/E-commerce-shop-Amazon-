import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('shops')
@Index('idx_shops_user_id', ['user_id'])
@Index('idx_shops_status', ['status'])
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  user_id: number;

  @Column({ type: 'nvarchar', length: 100 })
  name: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  banner_url: string | null;

  @Column({ type: 'nvarchar', length: 30, default: 'pending_verification' })
  status: string;

  @Column({ type: 'datetime2', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'int', nullable: true })
  verified_by: number | null;

  @Column({ type: 'datetime2', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'datetime2', nullable: true })
  banned_at: Date | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier: User;
}
