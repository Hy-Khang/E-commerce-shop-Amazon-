import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLatLngToAddresses1751400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE addresses ADD latitude DECIMAL(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE addresses ADD longitude DECIMAL(10,7) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE addresses DROP COLUMN longitude`);
    await queryRunner.query(`ALTER TABLE addresses DROP COLUMN latitude`);
  }
}
