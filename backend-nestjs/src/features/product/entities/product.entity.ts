import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('products')
@Index('idx_products_category_id', ['category_id'])
@Index('idx_products_shop_id', ['shop_id'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option1_label: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  option2_label: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  updated_at: Date;

  @Column()
  category_id: number;

  @Column({ type: 'int', nullable: true })
  shop_id: number | null;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Shop, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    eager: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    eager: true,
  })
  images: ProductImage[];
}
