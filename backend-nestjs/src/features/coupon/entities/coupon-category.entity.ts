import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Category } from '../../product/entities/category.entity';

@Entity('coupon_categories')
@Unique('uq_coupon_categories_coupon_category', ['coupon_id', 'category_id'])
export class CouponCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  coupon_id: number;

  @Column()
  category_id: number;

  @ManyToOne(() => Coupon, (coupon) => coupon.coupon_categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
