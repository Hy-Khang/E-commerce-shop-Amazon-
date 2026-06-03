import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index('idx_orders_user_id', ['user_id'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'nvarchar', length: 20 })
  payment_method: string;

  @Column({ type: 'nvarchar', length: 20, default: 'unpaid' })
  payment_status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'nvarchar', length: 'MAX' })
  shipping_address: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  coupon_code: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  order_items: OrderItem[];
}
