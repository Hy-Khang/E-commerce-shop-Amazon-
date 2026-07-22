import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_auth_providers')
export class UserAuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ type: 'nvarchar', length: 20 })
  provider: string;

  @Column({ type: 'nvarchar', length: 255 })
  provider_id: string;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.auth_providers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
