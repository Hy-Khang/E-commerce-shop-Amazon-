import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FlashSaleItem } from './flash-sale-item.entity';

@Entity('flash_sales')
@Index('idx_flash_sales_status', ['status'])
@Index('idx_flash_sales_starts_at', ['starts_at'])
@Index('idx_flash_sales_ends_at', ['ends_at'])
export class FlashSale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 150 })
  name: string;

  // Seller registration window — sellers may register products only while
  // now ∈ [registration_starts_at, registration_ends_at]. Must close on/before
  // the deal opens: registration_starts_at < registration_ends_at ≤ starts_at.
  @Column({ type: 'datetime2' })
  registration_starts_at: Date;

  @Column({ type: 'datetime2' })
  registration_ends_at: Date;

  @Column({ type: 'datetime2' })
  starts_at: Date;

  @Column({ type: 'datetime2' })
  ends_at: Date;

  // Mandatory minimum discount (% off the variant's original price) a seller
  // registration must meet to be valid. 0 = no floor.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  min_discount_percent: number;

  // scheduled | active | ended — driven by FlashSaleScheduler cron.
  @Column({ type: 'nvarchar', length: 20, default: 'scheduled' })
  status: string;

  @Column({ type: 'bit', default: true })
  is_active: boolean;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  created_at: Date;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @OneToMany(() => FlashSaleItem, (item) => item.flash_sale, { cascade: true })
  items: FlashSaleItem[];
}
