import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecentlyViewedTable1756500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE recently_viewed (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        viewed_at DATETIME2 NOT NULL CONSTRAINT df_recently_viewed_viewed_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_recently_viewed PRIMARY KEY (id),
        CONSTRAINT uq_recently_viewed_user_product UNIQUE (user_id, product_id),
        CONSTRAINT fk_recently_viewed_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_recently_viewed_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_recently_viewed_user_id ON recently_viewed(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_recently_viewed_user_viewed ON recently_viewed(user_id, viewed_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_recently_viewed_user_viewed ON recently_viewed`);
    await queryRunner.query(`DROP INDEX idx_recently_viewed_user_id ON recently_viewed`);
    await queryRunner.query(`DROP TABLE recently_viewed`);
  }
}
