import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeOrderGroupIdNotNull1751328000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill any remaining NULL order_group_id with unique UUIDs
    await queryRunner.query(`
      UPDATE orders SET order_group_id = LOWER(NEWID())
      WHERE order_group_id IS NULL
    `);

    // Drop existing index before altering column
    await queryRunner.query(`DROP INDEX idx_orders_order_group_id ON orders`);

    // Make NOT NULL
    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN order_group_id NVARCHAR(36) NOT NULL`,
    );

    // Recreate index
    await queryRunner.query(
      `CREATE INDEX idx_orders_order_group_id ON orders(order_group_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_orders_order_group_id ON orders`);

    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN order_group_id NVARCHAR(36) NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_orders_order_group_id ON orders(order_group_id)`,
    );
  }
}
