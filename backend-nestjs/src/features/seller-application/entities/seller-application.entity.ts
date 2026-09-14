import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

/**
 * A customer's request to become a seller. Admin reviews the queue; approving
 * grants the seller role + materializes an active shop. A `rejected` row is
 * kept for audit and lets the user re-apply.
 */
@Entity('seller_applications')
@Index('idx_seller_applications_user_id', ['user_id'])
@Index('idx_seller_applications_status', ['status'])
// Filtered UNIQUE: at most one pending application per user. Approved/rejected
// rows are retained (audit) and allow the user to apply again.
@Index('uq_seller_applications_user_pending', ['user_id'], {
  unique: true,
  where: "status = 'pending'",
})
export class SellerApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  // pending | approved | rejected
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 100 })
  shop_name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  business_name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  banner_url: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reject_reason: string | null;

  @Column({ type: 'int', nullable: true })
  reviewed_by: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
