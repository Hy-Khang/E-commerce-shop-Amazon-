import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
@Index('idx_carts_user_id', ['user_id'])
@Index('idx_carts_session_id', ['session_id'])
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  user_id: number;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  session_id: string;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart)
  items: CartItem[];
}
