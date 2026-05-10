import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  thumbnail_url: string;

  @Column({ type: 'bit', default: true })
  is_active: boolean;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  updated_at: Date;

  @Column()
  category_id: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    eager: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    eager: true,
  })
  images: ProductImage[];
}
