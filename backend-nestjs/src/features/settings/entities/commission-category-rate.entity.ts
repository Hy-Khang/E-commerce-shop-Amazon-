import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../product/entities/category.entity';

/**
 * Per-category commission override, used when `commission.mode = 'category'`.
 * A missing category falls back to the platform `commission.rate_percent`.
 */
@Entity('commission_category_rates')
export class CommissionCategoryRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  category_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rate_percent: number;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
