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
 * A lot of earned Xu. Source of truth for balance and expiry, consumed FIFO
 * (oldest still-valid batch first). Balance =
 * `SUM(amount_remaining) WHERE status='active' AND expires_at > now`.
 */
@Entity('coin_batches')
@Index('idx_coin_batches_user_status', ['user_id', 'status'])
@Index('idx_coin_batches_user_expiry', ['user_id', 'expires_at'])
export class CoinBatch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'int', nullable: true })
  source_order_id: number | null;

  @Column({ type: 'int' })
  amount_earned: number;

  @Column({ type: 'int' })
  amount_remaining: number;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  earned_at: Date;

  @Column({ type: 'datetime2' })
  expires_at: Date;

  @Column({ type: 'nvarchar', length: 20, default: 'active' })
  status: string;

  // source_order_id → orders.id (SET NULL): a batch outlives its source order.
  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_order_id' })
  source_order: Order | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
