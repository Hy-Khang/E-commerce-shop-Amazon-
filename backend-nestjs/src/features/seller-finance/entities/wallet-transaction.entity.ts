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
import { WithdrawalRequest } from './withdrawal-request.entity';

/**
 * Immutable seller-wallet ledger. `amount` is a positive magnitude; the sign is
 * implied by `type` (sale_earning / withdrawal_refund credit; withdrawal /
 * reversal debit).
 */
@Entity('wallet_transactions')
@Index('idx_wallet_transactions_user_created', ['user_id', 'created_at'])
@Index('idx_wallet_transactions_order', ['order_id'])
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  // sale_earning | withdrawal | reversal | withdrawal_refund
  @Column({ type: 'nvarchar', length: 20 })
  type: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'int', nullable: true })
  order_id: number | null;

  @Column({ type: 'int', nullable: true })
  withdrawal_id: number | null;

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

  // ⚠️ NO ACTION (default) — NOT CASCADE/SET NULL. `users` already cascades here
  // directly; a second cascade path via withdrawal_requests → wallet_transactions
  // would trip SQL Server error 1785 (same fix as coin_transactions.batch_id).
  @ManyToOne(() => WithdrawalRequest, { nullable: true })
  @JoinColumn({ name: 'withdrawal_id' })
  withdrawal: WithdrawalRequest | null;
}
