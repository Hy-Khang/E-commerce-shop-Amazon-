import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Shop Decoration (block builder): add `shops.decoration_config` — a versioned
 * JSON envelope `{ version, theme?, blocks[] }` describing the seller's
 * customized storefront layout, stored as a raw NVARCHAR(MAX) string (repo
 * JSON convention). NULL = default layout (backward compatible with old shops).
 * Dev auto-adds via `synchronize`; this migration covers non-sync/prod.
 */
export class AddDecorationConfigToShops1756900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE shops ADD decoration_config NVARCHAR(MAX) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE shops DROP COLUMN decoration_config`);
  }
}
