import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Single-row AI Chatbox settings (admin-controlled, Module 13). `chatbox_enabled`
 * gates the widget on the storefront; `system_prompt` optionally overrides the
 * built-in default prompt. Seeded with one row; the service reads/writes id = 1.
 */
@Entity('ai_settings')
export class AiSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bit', default: true })
  chatbox_enabled: boolean;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  system_prompt: string | null;

  @Column({ type: 'datetime2', default: () => 'SYSUTCDATETIME()' })
  updated_at: Date;
}
