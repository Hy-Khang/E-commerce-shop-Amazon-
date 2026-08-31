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
 * One AI Chatbox thread. Owned by a Customer (`user_id`) or a Guest
 * (`session_id`, mirrors `carts`). Persisted so Admin (Module 13) can review
 * conversation quality and the storefront can resume a thread across reloads.
 */
@Entity('ai_conversations')
@Index('idx_ai_conversations_user_id', ['user_id'])
@Index('idx_ai_conversations_session_id', ['session_id'])
export class AiConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  user_id: number | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  session_id: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  // user_id → users.id (SET NULL): keep guest/anonymized threads for audit even
  // if the account is removed. Users are soft-banned, not hard-deleted.
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}
