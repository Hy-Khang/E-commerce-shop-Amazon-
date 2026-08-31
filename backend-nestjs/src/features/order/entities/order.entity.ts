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
import { Shop } from '../../shop/entities/shop.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index('idx_orders_user_id', ['user_id'])
@Index('idx_orders_delivered_at', ['delivered_at'])
@Index('idx_orders_shipper_id', ['shipper_id'])
@Index('idx_orders_shop_id', ['shop_id'])
@Index('idx_orders_order_group_id', ['order_group_id'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  shop_id: number;

  @Column({ type: 'nvarchar', length: 100 })
  shop_name: string;

  @Column({ type: 'nvarchar', length: 36 })
  order_group_id: string;

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

  // Xu (Hoàn Xu) redeemed against this sub-order — snapshot so it can be refunded
  // on cancel. `total_amount = shopItemsTotal − discount_amount − coin_discount + shipping_fee`.
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  coin_discount: number;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @Column({ type: 'datetime2', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'int', nullable: true })
  shipper_id: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shipper_id' })
  shipper: User;

  @OneToMany(() => OrderItem, (item) => item.order)
  order_items: OrderItem[];
}
