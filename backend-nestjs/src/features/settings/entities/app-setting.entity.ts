import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Generic key/value application settings — runtime-editable config the admin can
 * change without a redeploy (unlike ENV). Values are stored as strings; the
 * owning service casts them to their concrete type. Currently backs the Coin
 * (Hoàn Xu) feature config; reusable for other runtime toggles later.
 */
@Entity('app_settings')
@Index('uq_app_settings_key', ['key'], { unique: true })
export class AppSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 100 })
  key: string;

  @Column({ type: 'nvarchar', length: 500 })
  value: string;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;
}
