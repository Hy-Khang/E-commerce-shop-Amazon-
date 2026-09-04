import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContextToNotifications1749300007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE notifications ADD context NVARCHAR(20) NOT NULL CONSTRAINT df_notifications_context DEFAULT 'customer'`,
    );

    await queryRunner.query(
      `DROP INDEX idx_notifications_user_id_is_read ON notifications`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_context_read ON notifications(user_id, context, is_read)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_notifications_user_context_read ON notifications`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read)`,
    );

    await queryRunner.query(
      `ALTER TABLE notifications DROP CONSTRAINT df_notifications_context`,
    );

    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN context`);
  }
}
