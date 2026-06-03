import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('reviews')
@Index('idx_reviews_product_id', ['product_id'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  product_id: number;

  @Column()
  order_id: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  comment: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
