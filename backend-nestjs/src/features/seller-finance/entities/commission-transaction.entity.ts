import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

/**
 * Immutable platform-commission ledger (the SÀN's take, for reporting). One
 * `charge` row per completed order; a defensive `reverse` on cancel. `amount`
 * fields are positive magnitudes — the direction is implied by `type`.
 */
@Entity('commission_transactions')
@Index('idx_commission_transactions_order', ['order_id'])
@Index('idx_commission_transactions_shop_created', ['shop_id', 'created_at'])
export class CommissionTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  shop_id: number;

  // Seller who owns the shop (denormalized for per-seller reporting).
  @Column()
  user_id: number;

  @Column({ type: 'int', nullable: true })
  order_id: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  base_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rate_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_amount: number;

  // charge | reverse
  @Column({ type: 'nvarchar', length: 20 })
  type: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  note: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;
}
