import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShopsTable1749300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE shops (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        name NVARCHAR(100) NOT NULL,
        slug NVARCHAR(100) NOT NULL,
        description NVARCHAR(MAX) NULL,
        logo_url NVARCHAR(500) NULL,
        banner_url NVARCHAR(500) NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT df_shops_status DEFAULT 'pending_verification',
        verified_at DATETIME2 NULL,
        verified_by INT NULL,
        suspended_at DATETIME2 NULL,
        banned_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_shops_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT df_shops_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_shops PRIMARY KEY (id),
        CONSTRAINT uq_shops_user_id UNIQUE (user_id),
        CONSTRAINT uq_shops_slug UNIQUE (slug),
        CONSTRAINT fk_shops_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION,
        CONSTRAINT fk_shops_verified_by FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT ck_shops_status CHECK (status IN ('pending_verification', 'active', 'suspended', 'banned'))
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_shops_user_id ON shops(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_shops_status ON shops(status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_shops_status ON shops`);
    await queryRunner.query(`DROP INDEX idx_shops_user_id ON shops`);
    await queryRunner.query(`DROP TABLE shops`);
  }
}
