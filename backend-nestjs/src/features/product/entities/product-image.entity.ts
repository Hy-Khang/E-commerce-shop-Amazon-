import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 500 })
  image_url: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product, (product) => product.images)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
