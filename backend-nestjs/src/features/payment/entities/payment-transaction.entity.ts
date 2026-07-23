import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity('payment_transactions')
@Index('idx_payment_transactions_order_id', ['order_id'])
@Index('idx_payment_transactions_status', ['status'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  transaction_ref: string;

  @Column({ type: 'nvarchar', length: 20 })
  gateway: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  gateway_transaction_id: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  gateway_response: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
