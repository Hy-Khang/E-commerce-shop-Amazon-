import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('coupon_products')
@Unique('uq_coupon_products_coupon_product', ['coupon_id', 'product_id'])
export class CouponProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  coupon_id: number;

  @Column()
  product_id: number;

  @ManyToOne(() => Coupon, (coupon) => coupon.coupon_products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
