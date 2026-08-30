import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('messages')
@Index('idx_messages_conversation_id', ['conversation_id'])
@Index('idx_messages_conversation_created', ['conversation_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversation_id: number;

  @Column()
  sender_id: number;

  @Column({ type: 'nvarchar', length: 20 })
  sender_type: string;

  @Column({ type: 'nvarchar', length: 2000 })
  content: string;

  @Column({ type: 'nvarchar', length: 20, default: 'sent' })
  status: string;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}
