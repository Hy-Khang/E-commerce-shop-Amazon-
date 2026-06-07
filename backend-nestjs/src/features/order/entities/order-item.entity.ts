import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from '../../product/entities/product-variant.entity';
import { Order } from './order.entity';

@Entity('order_items')
@Index('idx_order_items_order_id', ['order_id'])
@Index('idx_order_items_shop_id', ['shop_id'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ nullable: true })
  product_variant_id: number;

  @Column({ type: 'nvarchar', length: 255 })
  product_name: string;

  @Column({ type: 'nvarchar', length: 50 })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  variant_option1_label: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  variant_option1_value: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  variant_option2_label: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  variant_option2_value: string | null;

  @Column({ type: 'int', nullable: true })
  shop_id: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  shop_name: string | null;

  @ManyToOne(() => Order, (order) => order.order_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant;
}
