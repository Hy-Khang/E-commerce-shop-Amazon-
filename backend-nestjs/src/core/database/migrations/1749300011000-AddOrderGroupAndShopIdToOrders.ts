import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderGroupAndShopIdToOrders1749300011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add columns (nullable initially for backfill)
    await queryRunner.query(`ALTER TABLE orders ADD shop_id INT NULL`);
    await queryRunner.query(
      `ALTER TABLE orders ADD order_group_id NVARCHAR(36) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD shop_name NVARCHAR(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE payment_transactions ADD order_group_id NVARCHAR(36) NULL`,
    );

    // Step 2: Backfill existing orders from order_items
    await queryRunner.query(`
      UPDATE o SET o.shop_id = sub.shop_id, o.shop_name = sub.shop_name
      FROM orders o
      CROSS APPLY (
        SELECT TOP 1 oi.shop_id, oi.shop_name
        FROM order_items oi WHERE oi.order_id = o.id AND oi.shop_id IS NOT NULL
      ) sub
      WHERE o.shop_id IS NULL
    `);

    // Fallback: orders with no matching items get first shop
    await queryRunner.query(`
      UPDATE orders SET shop_id = (SELECT TOP 1 id FROM shops)
      WHERE shop_id IS NULL
    `);
    await queryRunner.query(`
      UPDATE orders SET shop_name = (SELECT TOP 1 name FROM shops WHERE id = orders.shop_id)
      WHERE shop_name IS NULL
    `);

    // Step 3: Make NOT NULL + add constraints and indexes
    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN shop_id INT NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ALTER COLUMN shop_name NVARCHAR(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT fk_orders_shop_id FOREIGN KEY (shop_id) REFERENCES shops(id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_orders_shop_id ON orders(shop_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_orders_order_group_id ON orders(order_group_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_payment_transactions_order_group_id ON payment_transactions(order_group_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_payment_transactions_order_group_id ON payment_transactions`,
    );
    await queryRunner.query(`DROP INDEX idx_orders_order_group_id ON orders`);
    await queryRunner.query(`DROP INDEX idx_orders_shop_id ON orders`);
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT fk_orders_shop_id`,
    );
    await queryRunner.query(
      `ALTER TABLE payment_transactions DROP COLUMN order_group_id`,
    );
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN shop_name`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN order_group_id`);
    await queryRunner.query(`ALTER TABLE orders DROP COLUMN shop_id`);
  }
}
