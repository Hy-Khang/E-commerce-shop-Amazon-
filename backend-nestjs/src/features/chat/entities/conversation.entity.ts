import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Shop } from '../../shop/entities/shop.entity';

@Entity('conversations')
@Unique('uq_conversations_customer_shop', ['customer_id', 'shop_id'])
@Index('idx_conversations_customer_id', ['customer_id'])
@Index('idx_conversations_shop_id', ['shop_id'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customer_id: number;

  @Column()
  shop_id: number;

  @Column({ type: 'datetime2', nullable: true })
  last_message_at: Date | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  last_message_preview: string | null;

  @Column({ type: 'int', default: 0 })
  customer_unread: number;

  @Column({ type: 'int', default: 0 })
  seller_unread: number;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;
}
