import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1749300005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE notifications (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        type NVARCHAR(50) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        data NVARCHAR(MAX) NULL,
        is_read BIT NOT NULL CONSTRAINT df_notifications_is_read DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT df_notifications_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_notifications PRIMARY KEY (id),
        CONSTRAINT fk_notifications_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_notifications_user_id_is_read ON notifications(user_id, is_read)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_notifications_created_at ON notifications(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_notifications_created_at ON notifications`,
    );
    await queryRunner.query(
      `DROP INDEX idx_notifications_user_id_is_read ON notifications`,
    );
    await queryRunner.query(`DROP TABLE notifications`);
  }
}
