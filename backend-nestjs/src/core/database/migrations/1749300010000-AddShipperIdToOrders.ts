import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShipperIdToOrders1749300010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE orders ADD shipper_id INT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE orders ADD CONSTRAINT fk_orders_shipper_id FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE SET NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX idx_orders_shipper_id ON orders(shipper_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_orders_shipper_id ON orders`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP CONSTRAINT fk_orders_shipper_id`,
    );
    await queryRunner.query(
      `ALTER TABLE orders DROP COLUMN shipper_id`,
    );
  }
}
