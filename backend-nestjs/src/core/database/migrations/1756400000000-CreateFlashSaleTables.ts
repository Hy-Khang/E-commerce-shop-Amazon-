import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlashSaleTables1756400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE flash_sales (
        id                     INT IDENTITY(1,1) PRIMARY KEY,
        name                   NVARCHAR(150) NOT NULL,
        registration_starts_at DATETIME2     NOT NULL,
        registration_ends_at   DATETIME2     NOT NULL,
        starts_at              DATETIME2     NOT NULL,
        ends_at                DATETIME2     NOT NULL,
        min_discount_percent   DECIMAL(5,2)  NOT NULL DEFAULT 0,
        status                 NVARCHAR(20)  NOT NULL DEFAULT 'scheduled',
        is_active              BIT           NOT NULL DEFAULT 1,
        created_at             DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at             DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_flash_sales_status ON flash_sales(status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_flash_sales_starts_at ON flash_sales(starts_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_flash_sales_ends_at ON flash_sales(ends_at)`,
    );

    await queryRunner.query(`
      CREATE TABLE flash_sale_items (
        id                 INT IDENTITY(1,1) PRIMARY KEY,
        flash_sale_id      INT           NOT NULL,
        product_variant_id INT           NOT NULL,
        shop_id            INT           NOT NULL,
        flash_price        DECIMAL(10,2) NOT NULL,
        flash_quantity     INT           NOT NULL,
        sold_quantity      INT           NOT NULL DEFAULT 0,
        status             NVARCHAR(20)  NOT NULL DEFAULT 'pending',
        created_by         INT           NULL,
        reviewed_by        INT           NULL,
        reviewed_at        DATETIME2     NULL,
        reject_reason      NVARCHAR(255) NULL,
        CONSTRAINT fk_fsi_flash_sale FOREIGN KEY (flash_sale_id)
          REFERENCES flash_sales(id) ON DELETE CASCADE,
        CONSTRAINT fk_fsi_variant FOREIGN KEY (product_variant_id)
          REFERENCES product_variants(id) ON DELETE CASCADE,
        CONSTRAINT fk_fsi_shop FOREIGN KEY (shop_id)
          REFERENCES shops(id),
        CONSTRAINT fk_fsi_created_by FOREIGN KEY (created_by)
          REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_flash_sale_items_flash_sale_id ON flash_sale_items(flash_sale_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_flash_sale_items_variant_id ON flash_sale_items(product_variant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_flash_sale_items_shop_id ON flash_sale_items(shop_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_flash_sale_items_sale_status ON flash_sale_items(flash_sale_id, status)`,
    );
    // Filtered UNIQUE: one non-rejected registration per (campaign, variant).
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_flash_sale_items_sale_variant ON flash_sale_items(flash_sale_id, product_variant_id) WHERE status <> 'rejected'`,
    );

    // order_items snapshot linkage — needed to reverse sold_quantity on cancel.
    await queryRunner.query(
      `ALTER TABLE order_items ADD flash_sale_item_id INT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE order_items
      ADD CONSTRAINT fk_order_items_flash_sale_item
        FOREIGN KEY (flash_sale_item_id)
        REFERENCES flash_sale_items(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE order_items DROP CONSTRAINT fk_order_items_flash_sale_item`,
    );
    await queryRunner.query(
      `ALTER TABLE order_items DROP COLUMN flash_sale_item_id`,
    );

    await queryRunner.query(
      `DROP INDEX uq_flash_sale_items_sale_variant ON flash_sale_items`,
    );
    await queryRunner.query(
      `DROP INDEX idx_flash_sale_items_sale_status ON flash_sale_items`,
    );
    await queryRunner.query(
      `DROP INDEX idx_flash_sale_items_shop_id ON flash_sale_items`,
    );
    await queryRunner.query(
      `DROP INDEX idx_flash_sale_items_variant_id ON flash_sale_items`,
    );
    await queryRunner.query(
      `DROP INDEX idx_flash_sale_items_flash_sale_id ON flash_sale_items`,
    );
    await queryRunner.query(`DROP TABLE flash_sale_items`);

    await queryRunner.query(`DROP INDEX idx_flash_sales_ends_at ON flash_sales`);
    await queryRunner.query(`DROP INDEX idx_flash_sales_starts_at ON flash_sales`);
    await queryRunner.query(`DROP INDEX idx_flash_sales_status ON flash_sales`);
    await queryRunner.query(`DROP TABLE flash_sales`);
  }
}
