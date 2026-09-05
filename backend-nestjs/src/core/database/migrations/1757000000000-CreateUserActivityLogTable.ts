import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserActivityLogTable1757000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_activity_log (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NULL,
        session_id NVARCHAR(100) NULL,
        action NVARCHAR(30) NOT NULL,
        target_type NVARCHAR(20) NOT NULL,
        target_id INT NULL,
        metadata NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_user_activity_log_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_user_activity_log PRIMARY KEY (id),
        CONSTRAINT fk_user_activity_log_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_user_activity_log_user ON user_activity_log(user_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_activity_log_session ON user_activity_log(session_id, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_activity_log_target ON user_activity_log(target_type, target_id, action)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_activity_log_created ON user_activity_log(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_user_activity_log_created ON user_activity_log`,
    );
    await queryRunner.query(
      `DROP INDEX idx_user_activity_log_target ON user_activity_log`,
    );
    await queryRunner.query(
      `DROP INDEX idx_user_activity_log_session ON user_activity_log`,
    );
    await queryRunner.query(
      `DROP INDEX idx_user_activity_log_user ON user_activity_log`,
    );
    await queryRunner.query(`DROP TABLE user_activity_log`);
  }
}
