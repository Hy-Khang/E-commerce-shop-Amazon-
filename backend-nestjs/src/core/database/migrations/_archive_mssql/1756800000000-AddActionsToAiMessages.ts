import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AI Shopping Agent (Module 21 upgrade): add `ai_messages.actions` — a JSON
 * snapshot of the agent action cards produced for an assistant turn
 * (cart_updated / checkout_proposal / order_cancelled / needs_login) so the
 * frontend can re-render them on resume and Admin can review them.
 */
export class AddActionsToAiMessages1756800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ai_messages ADD actions NVARCHAR(MAX) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ai_messages DROP COLUMN actions`);
  }
}
