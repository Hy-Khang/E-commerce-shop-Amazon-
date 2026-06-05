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
import { User } from '../../auth/entities/user.entity';

@Entity('products')
@Index('idx_products_category_id', ['category_id'])
@Index('idx_products_seller_id', ['seller_id'])
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

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  option1_label: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  option2_label: string | null;

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

  @Column({ type: 'int', nullable: true })
  seller_id: number | null;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    eager: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    eager: true,
  })
  images: ProductImage[];
}
