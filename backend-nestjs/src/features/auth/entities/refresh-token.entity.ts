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

  @Column({ type: 'nvarchar', length: 255 })
  token_hash: string;

  @Column({ type: 'datetime2' })
  expires_at: Date;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @Column({ type: 'bit', default: false })
  is_revoked: boolean;

  @Column({ type: 'nvarchar', length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  user_agent: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  device_name: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.refresh_tokens)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
