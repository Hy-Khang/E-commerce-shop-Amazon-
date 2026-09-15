import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiConversation } from './ai-conversation.entity';

/**
 * One turn in an AI Chatbox thread. `role` is `user` or `assistant`.
 * `product_ids` snapshots the JSON array of product ids the assistant suggested
 * for that turn, so the frontend can re-render product cards when a thread is
 * resumed or reviewed in Admin.
 */
@Entity('ai_messages')
@Index('idx_ai_messages_conversation_created', [
  'conversation_id',
  'created_at',
])
export class AiMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  conversation_id: number;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  product_ids: string | null;

  /**
   * JSON snapshot of agent action cards produced for this (assistant) turn —
   * cart_updated / checkout_proposal / order_cancelled / needs_login — so the
   * frontend can re-render them on resume and Admin can review them.
   */
  @Column({ type: 'text', nullable: true })
  actions: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @ManyToOne(() => AiConversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;
}
