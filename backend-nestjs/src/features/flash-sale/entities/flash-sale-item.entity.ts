import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FlashSale } from './flash-sale.entity';
import { ProductVariant } from '../../product/entities/product-variant.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('flash_sale_items')
@Index('idx_flash_sale_items_flash_sale_id', ['flash_sale_id'])
@Index('idx_flash_sale_items_variant_id', ['product_variant_id'])
@Index('idx_flash_sale_items_shop_id', ['shop_id'])
@Index('idx_flash_sale_items_sale_status', ['flash_sale_id', 'status'])
// Filtered UNIQUE: one non-rejected registration per (campaign, variant). A
// rejected row is kept for audit and lets the seller register the variant again.
@Index(
  'uq_flash_sale_items_sale_variant',
  ['flash_sale_id', 'product_variant_id'],
  {
    unique: true,
    where: "status <> 'rejected'",
  },
)
export class FlashSaleItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  flash_sale_id: number;

  @Column()
  product_variant_id: number;

  // Owning shop of this registration (the seller's shop).
  @Column()
  shop_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  flash_price: number;

  @Column({ type: 'int' })
  flash_quantity: number;

  @Column({ type: 'int', default: 0 })
  sold_quantity: number;

  // pending | approved | rejected — seller registers as pending, admin moderates.
  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: string;

  // Seller user who registered (audit). SET NULL if the user is deleted.
  @Column({ type: 'int', nullable: true })
  created_by: number | null;

  // Admin who reviewed (audit).
  @Column({ type: 'int', nullable: true })
  reviewed_by: number | null;

  @Column({ type: 'datetime2', nullable: true })
  reviewed_at: Date | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  reject_reason: string | null;

  @ManyToOne(() => FlashSale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flash_sale_id' })
  flash_sale: FlashSale;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant;

  // Loaded on the admin moderation view to display the owning shop's name.
  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
