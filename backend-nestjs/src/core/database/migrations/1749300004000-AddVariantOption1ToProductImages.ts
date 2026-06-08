import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVariantOption1ToProductImages1749300004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE product_images ADD variant_option1 NVARCHAR(50) NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_product_images_variant_option1 ON product_images(product_id, variant_option1, sort_order)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_product_images_variant_option1 ON product_images`,
    );
    await queryRunner.query(
      `ALTER TABLE product_images DROP COLUMN variant_option1`,
    );
  }
}
