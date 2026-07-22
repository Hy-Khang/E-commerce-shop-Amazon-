import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('oauth_codes')
export class OAuthCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 255 })
  code_hash: string;

  @Column()
  user_id: number;

  @Column({ type: 'datetime2' })
  expires_at: Date;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;
}
