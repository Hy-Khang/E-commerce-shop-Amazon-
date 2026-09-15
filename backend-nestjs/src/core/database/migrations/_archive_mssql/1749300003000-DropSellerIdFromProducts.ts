import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropSellerIdFromProducts1749300003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Backfill order_items.shop_id using seller_id path
    await queryRunner.query(`
      UPDATE oi SET oi.shop_id = s.id, oi.shop_name = s.name
      FROM order_items oi
      INNER JOIN product_variants pv ON oi.product_variant_id = pv.id
      INNER JOIN products p ON pv.product_id = p.id
      INNER JOIN shops s ON p.seller_id = s.user_id
      WHERE oi.shop_id IS NULL AND oi.product_variant_id IS NOT NULL
    `);

    // 2. Drop seller_id index and FK, then column
    // Find and drop the FK constraint name dynamically
    const fkResult: { name: string }[] = await queryRunner.query(`
      SELECT fk.name FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      WHERE OBJECT_NAME(fk.parent_object_id) = 'products' AND c.name = 'seller_id'
    `);

    // Drop index if exists
    const idxResult: { name: string }[] = await queryRunner.query(`
      SELECT i.name FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE OBJECT_NAME(i.object_id) = 'products' AND c.name = 'seller_id' AND i.is_primary_key = 0
    `);

    for (const idx of idxResult) {
      await queryRunner.query(`DROP INDEX [${idx.name}] ON products`);
    }

    for (const fk of fkResult) {
      await queryRunner.query(
        `ALTER TABLE products DROP CONSTRAINT [${fk.name}]`,
      );
    }

    await queryRunner.query(`ALTER TABLE products DROP COLUMN seller_id`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add seller_id column
    await queryRunner.query(`ALTER TABLE products ADD seller_id INT NULL`);
    await queryRunner.query(`
      ALTER TABLE products ADD CONSTRAINT fk_products_seller_id
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE NO ACTION
    `);
    await queryRunner.query(
      `CREATE INDEX idx_products_seller_id ON products(seller_id)`,
    );

    // Backfill seller_id from shop_id
    await queryRunner.query(`
      UPDATE p SET p.seller_id = s.user_id
      FROM products p
      INNER JOIN shops s ON p.shop_id = s.id
      WHERE p.shop_id IS NOT NULL
    `);

    // Clear order_items shop data
    await queryRunner.query(
      `UPDATE order_items SET shop_id = NULL, shop_name = NULL`,
    );
  }
}
