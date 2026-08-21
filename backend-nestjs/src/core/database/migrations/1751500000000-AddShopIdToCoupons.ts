import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopIdToCoupons1751500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // coupons: add shop_id (NULL = platform-wide coupon, NOT NULL = shop coupon)
    await queryRunner.query(`ALTER TABLE coupons ADD shop_id INT NULL`);
    await queryRunner.query(`
      ALTER TABLE coupons ADD CONSTRAINT fk_coupons_shop_id
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX idx_coupons_shop_id ON coupons(shop_id)`);

    // grant seller role the coupons:* permissions (idempotent — skip rows already present)
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = N'seller'
        AND p.resource = N'coupons'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // remove seller coupon permissions
    await queryRunner.query(`
      DELETE rp
      FROM role_permissions rp
      INNER JOIN roles r ON r.id = rp.role_id
      INNER JOIN permissions p ON p.id = rp.permission_id
      WHERE r.name = N'seller' AND p.resource = N'coupons'
    `);

    await queryRunner.query(`DROP INDEX idx_coupons_shop_id ON coupons`);
    await queryRunner.query(`ALTER TABLE coupons DROP CONSTRAINT fk_coupons_shop_id`);
    await queryRunner.query(`ALTER TABLE coupons DROP COLUMN shop_id`);
  }
}
