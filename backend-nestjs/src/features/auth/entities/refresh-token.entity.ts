import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Index('idx_refresh_tokens_token_hash', ['token_hash'])
@Index('idx_refresh_tokens_user_id', ['user_id'])
@Index('idx_refresh_tokens_expires_at', ['expires_at'])
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  token_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_revoked: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device_name: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.refresh_tokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
