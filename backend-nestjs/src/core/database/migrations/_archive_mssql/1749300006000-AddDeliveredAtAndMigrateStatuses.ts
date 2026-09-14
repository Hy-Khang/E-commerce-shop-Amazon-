import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeliveredAtAndMigrateStatuses1749300006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders ADD delivered_at DATETIME2 NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_orders_delivered_at ON orders (delivered_at)`,
    );

    // Migrate existing 'delivered' orders to 'completed' (they have no delivered_at, so auto-complete is N/A)
    await queryRunner.query(
      `UPDATE orders SET status = 'completed' WHERE status = 'delivered'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Status migration is irreversible — cannot distinguish which 'completed' orders were originally 'delivered'
    await queryRunner.query(`DROP INDEX idx_orders_delivered_at ON orders`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN delivered_at`);
  }
}
