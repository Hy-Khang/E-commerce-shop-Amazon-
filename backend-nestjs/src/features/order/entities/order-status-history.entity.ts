import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('order_status_history')
@Index('idx_order_status_history_order_id', ['order_id'])
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  from_status: string | null;

  @Column({ type: 'nvarchar', length: 20 })
  to_status: string;

  @Column({ type: 'int', nullable: true })
  actor_id: number | null;

  @Column({ type: 'nvarchar', length: 20 })
  actor_type: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  note: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;
}
