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

  @Column({ type: 'nvarchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  password_hash: string | null;

  @Column({ type: 'nvarchar', length: 100 })
  full_name: string;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'bit', default: true })
  is_active: boolean;

  @Column({ type: 'bit', default: false })
  email_verified: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  email_verify_token: string | null;

  @Column({ type: 'datetime2', nullable: true })
  email_verify_expires: Date | null;

  @Column({ type: 'int', default: 0 })
  email_verify_count: number;

  @Column({ type: 'datetime2', nullable: true })
  email_verify_count_reset: Date | null;

  @Column({ type: 'int', default: 0 })
  email_verify_attempts: number;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  password_reset_token_hash: string | null;

  @Column({ type: 'datetime2', nullable: true })
  password_reset_expires_at: Date | null;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
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
