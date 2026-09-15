import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('oauth_codes')
export class OAuthCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  code_hash: string;

  @Column()
  user_id: number;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;
}
