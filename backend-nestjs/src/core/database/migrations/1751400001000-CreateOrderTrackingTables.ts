import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrderTrackingTables1751400001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE order_status_history (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        order_id    INT           NOT NULL,
        from_status NVARCHAR(20)  NULL,
        to_status   NVARCHAR(20)  NOT NULL,
        actor_id    INT           NULL,
        actor_type  NVARCHAR(20)  NOT NULL,
        note        NVARCHAR(255) NULL,
        created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id),
        CONSTRAINT fk_osh_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE order_tracking_locations (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        order_id   INT            NOT NULL,
        latitude   DECIMAL(10,7)  NOT NULL,
        longitude  DECIMAL(10,7)  NOT NULL,
        created_at DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_otl_order FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_order_tracking_locations_order_created ON order_tracking_locations(order_id, created_at DESC)`,
    );

    // Backfill: 1 history row per existing order
    await queryRunner.query(`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_type, created_at)
      SELECT id, NULL, status, 'SYSTEM', created_at
      FROM orders
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_order_tracking_locations_order_created ON order_tracking_locations`,
    );
    await queryRunner.query(`DROP TABLE order_tracking_locations`);

    await queryRunner.query(
      `DROP INDEX idx_order_status_history_order_id ON order_status_history`,
    );
    await queryRunner.query(`DROP TABLE order_status_history`);
  }
}
