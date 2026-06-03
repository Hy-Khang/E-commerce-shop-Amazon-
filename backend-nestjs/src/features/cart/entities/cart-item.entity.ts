import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../product/entities/product-variant.entity';

@Entity('cart_items')
@Index('idx_cart_items_cart_id', ['cart_id'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  cart_id: number;

  @Column()
  product_variant_id: number;

  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => ProductVariant, { eager: true })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant: ProductVariant;
}
