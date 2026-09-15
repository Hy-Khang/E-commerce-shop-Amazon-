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
@Index('idx_payment_transactions_order_group_id', ['order_group_id'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  order_group_id: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  transaction_ref: string;

  @Column({ type: 'varchar', length: 20 })
  gateway: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gateway_transaction_id: string | null;

  @Column({ type: 'text', nullable: true })
  gateway_response: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
