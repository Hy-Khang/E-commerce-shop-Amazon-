import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  size: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sale_price: number;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
