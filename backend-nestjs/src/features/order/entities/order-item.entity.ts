import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from '../../product/entities/product-variant.entity';
import { Order } from './order.entity';

@Entity('order_items')
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

  @ManyToOne(() => Order, (order) => order.order_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant;
}
