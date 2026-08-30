import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('recently_viewed')
@Unique('uq_recently_viewed_user_product', ['user_id', 'product_id'])
@Index('idx_recently_viewed_user_id', ['user_id'])
@Index('idx_recently_viewed_user_viewed', ['user_id', 'viewed_at'])
export class RecentlyViewed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  viewed_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
