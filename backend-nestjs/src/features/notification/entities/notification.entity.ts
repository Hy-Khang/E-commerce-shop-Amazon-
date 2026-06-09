import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('notifications')
@Index('idx_notifications_user_id_is_read', ['user_id', 'is_read'])
@Index('idx_notifications_created_at', ['created_at'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'nvarchar', length: 50 })
  type: string;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'nvarchar', length: 500 })
  message: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  data: string | null;

  @Column({ type: 'bit', default: false })
  is_read: boolean;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
