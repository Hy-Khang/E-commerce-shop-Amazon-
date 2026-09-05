import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

/**
 * A single behavioral signal used by Smart Recommendations (Module 22).
 *
 * Captured for both customers (`user_id`) and guests (`session_id`, mirrors
 * `carts.session_id`). `target_id` is **deliberately NOT a foreign key** — the
 * write path stays lenient (a later product/category delete must never
 * cascade-wipe history or break an insert); scoring joins to `products` /
 * `categories` best-effort and drops misses.
 */
@Entity('user_activity_log')
@Index('idx_user_activity_log_user', ['user_id', 'created_at'])
@Index('idx_user_activity_log_session', ['session_id', 'created_at'])
@Index('idx_user_activity_log_target', ['target_type', 'target_id', 'action'])
@Index('idx_user_activity_log_created', ['created_at'])
export class UserActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  user_id: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  session_id: string | null;

  // VIEW_PRODUCT / VIEW_CATEGORY / SEARCH / ADD_TO_CART / ADD_TO_WISHLIST / PURCHASE
  @Column({ type: 'nvarchar', length: 30 })
  action: string;

  // product / category / search
  @Column({ type: 'nvarchar', length: 20 })
  target_type: string;

  // product/category id (NULL for SEARCH). Not a FK — see class doc.
  @Column({ type: 'int', nullable: true })
  target_id: number | null;

  // JSON — e.g. { keyword } for SEARCH.
  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  metadata: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
