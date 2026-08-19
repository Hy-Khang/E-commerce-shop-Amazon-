import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminDisabledToCoupons1751600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // admin_disabled: sticky admin moderation lock for shop coupons.
    // 0 = normal, 1 = deactivated by admin (seller cannot re-enable).
    await queryRunner.query(
      `ALTER TABLE coupons ADD admin_disabled BIT NOT NULL CONSTRAINT df_coupons_admin_disabled DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE coupons DROP CONSTRAINT df_coupons_admin_disabled`,
    );
    await queryRunner.query(`ALTER TABLE coupons DROP COLUMN admin_disabled`);
  }
}
