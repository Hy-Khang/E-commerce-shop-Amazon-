import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CouponCategory } from './coupon-category.entity';
import { CouponProduct } from './coupon-product.entity';
import { CouponUsage } from './coupon-usage.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('coupons')
@Index('idx_coupons_is_active', ['is_active'])
@Index('idx_coupons_expires_at', ['expires_at'])
@Index('idx_coupons_shop_id', ['shop_id'])
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  // NULL = platform-wide coupon (admin). NOT NULL = shop coupon (seller-owned).
  @Column({ type: 'int', nullable: true })
  shop_id: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  discount_type: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  discount_value: number;

  @Column({ type: 'varchar', length: 20, default: 'all' })
  scope: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  min_order_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  max_discount_amount: number;

  @Column({ type: 'int', nullable: true })
  max_uses: number;

  @Column({ type: 'int', default: 1 })
  max_uses_per_user: number;

  @Column({ type: 'int', default: 0 })
  current_uses: number;

  @Column({ type: 'timestamptz' })
  starts_at: Date;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Sticky admin moderation lock (shop coupons only). When 1, the coupon is
  // treated as inactive and the owning seller cannot re-enable it — only an
  // admin can unlock it.
  @Column({ type: 'boolean', default: false })
  admin_disabled: boolean;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;

  @ManyToOne(() => Shop, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop | null;

  @OneToMany(() => CouponCategory, (cc) => cc.coupon, { cascade: true })
  coupon_categories: CouponCategory[];

  @OneToMany(() => CouponProduct, (cp) => cp.coupon, { cascade: true })
  coupon_products: CouponProduct[];

  @OneToMany(() => CouponUsage, (usage) => usage.coupon)
  usages: CouponUsage[];
}
