import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
@Index('idx_product_variants_product_options', [
  'product_id',
  'option1',
  'option2',
])
@Index('uq_pv_both_options', ['product_id', 'option1', 'option2'], {
  unique: true,
  where: 'option1 IS NOT NULL AND option2 IS NOT NULL',
})
@Index('uq_pv_option1_only', ['product_id', 'option1'], {
  unique: true,
  where: 'option1 IS NOT NULL AND option2 IS NULL',
})
@Index('uq_pv_no_options', ['product_id'], {
  unique: true,
  where: 'option1 IS NULL AND option2 IS NULL',
})
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  sku: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  option1: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  option2: string | null;

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
