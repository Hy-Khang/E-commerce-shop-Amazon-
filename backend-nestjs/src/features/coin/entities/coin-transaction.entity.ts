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
import { CoinBatch } from './coin-batch.entity';

/**
 * Immutable Xu ledger (audit trail). `amount` is always a positive magnitude;
 * the direction (credit/debit) is derived from `type`.
 */
@Entity('coin_transactions')
@Index('idx_coin_transactions_user_created', ['user_id', 'created_at'])
@Index('idx_coin_transactions_order', ['order_id'])
export class CoinTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'nvarchar', length: 20 })
  type: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', nullable: true })
  order_id: number | null;

  @Column({ type: 'int', nullable: true })
  batch_id: number | null;

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

  // ⚠️ NO ACTION (default) — NOT CASCADE/SET NULL. Without this, SQL Server
  // sees two cascade paths from `users` to `coin_transactions` (direct, and via
  // coin_batches) and rejects the schema with error 1785. Users are soft-banned
  // (is_active), never hard-deleted, so orphan batch_id is never hit in practice.
  @ManyToOne(() => CoinBatch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: CoinBatch | null;
}
