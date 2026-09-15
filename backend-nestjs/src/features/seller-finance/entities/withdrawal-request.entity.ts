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
 * A seller's payout request. On create, the amount is held (debited from the
 * wallet immediately). Admin approves (paid out-of-band) or rejects (refunds
 * the held amount back to the wallet).
 */
@Entity('withdrawal_requests')
@Index('idx_withdrawal_requests_user_created', ['user_id', 'created_at'])
@Index('idx_withdrawal_requests_status', ['status'])
export class WithdrawalRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // pending | approved | rejected
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 100 })
  bank_name: string;

  @Column({ type: 'varchar', length: 50 })
  bank_account_number: string;

  @Column({ type: 'varchar', length: 100 })
  bank_account_holder: string;

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
