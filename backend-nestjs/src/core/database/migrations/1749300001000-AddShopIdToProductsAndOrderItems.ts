import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopIdToProductsAndOrderItems1749300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // products: add shop_id (nullable during transition)
    await queryRunner.query(`ALTER TABLE products ADD shop_id INT NULL`);
    await queryRunner.query(`
      ALTER TABLE products ADD CONSTRAINT fk_products_shop_id
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX idx_products_shop_id ON products(shop_id)`);

    // order_items: add shop snapshots
    await queryRunner.query(`ALTER TABLE order_items ADD shop_id INT NULL`);
    await queryRunner.query(`ALTER TABLE order_items ADD shop_name NVARCHAR(100) NULL`);
    await queryRunner.query(`CREATE INDEX idx_order_items_shop_id ON order_items(shop_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // order_items: remove shop columns
    await queryRunner.query(`DROP INDEX idx_order_items_shop_id ON order_items`);
    await queryRunner.query(`ALTER TABLE order_items DROP COLUMN shop_name`);
    await queryRunner.query(`ALTER TABLE order_items DROP COLUMN shop_id`);

    // products: remove shop_id
    await queryRunner.query(`DROP INDEX idx_products_shop_id ON products`);
    await queryRunner.query(`ALTER TABLE products DROP CONSTRAINT fk_products_shop_id`);
    await queryRunner.query(`ALTER TABLE products DROP COLUMN shop_id`);
  }
}
