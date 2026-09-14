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

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  provider_id: string;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.auth_providers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
