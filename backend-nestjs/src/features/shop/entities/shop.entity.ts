import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
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

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner_url: string | null;

  /**
   * Storefront decoration (Shop Decoration block builder). A versioned JSON
   * envelope `{ version, theme?, blocks[] }` stored as a raw NVARCHAR(MAX)
   * string (repo convention — manual JSON.stringify/parse in the service, like
   * `orders.shipping_address` / `ai_messages.actions`). NULL = default layout.
   */
  @Column({ type: 'text', nullable: true })
  decoration_config: string | null;

  @Column({ type: 'varchar', length: 30, default: 'pending_verification' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  verified_at: Date | null;

  @Column({ type: 'int', nullable: true })
  verified_by: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  banned_at: Date | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  verifier: User;
}
