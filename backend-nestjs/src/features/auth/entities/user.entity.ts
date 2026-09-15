import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { RefreshToken } from './refresh-token.entity';
import { UserAuthProvider } from './user-auth-provider.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_verify_token: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  email_verify_expires: Date | null;

  @Column({ type: 'int', default: 0 })
  email_verify_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  email_verify_count_reset: Date | null;

  @Column({ type: 'int', default: 0 })
  email_verify_attempts: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token_hash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  password_reset_expires_at: Date | null;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  updated_at: Date;

  @Column()
  role_id: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];

  @OneToMany(() => UserAuthProvider, (uap) => uap.user)
  auth_providers: UserAuthProvider[];
}
