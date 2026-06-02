import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from '../../auth/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('coupon_usages')
@Index('idx_coupon_usages_coupon_id', ['coupon_id'])
@Index('idx_coupon_usages_user_id_coupon_id', ['user_id', 'coupon_id'])
@Index('idx_coupon_usages_order_id', ['order_id'])
export class CouponUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  coupon_id: number;

  @Column()
  user_id: number;

  @Column()
  order_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_amount: number;

  @Column({ type: 'nvarchar', length: 20, default: 'applied' })
  status: string;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => Coupon, (coupon) => coupon.usages)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
