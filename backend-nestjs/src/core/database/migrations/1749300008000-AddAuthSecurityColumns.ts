import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSecurityColumns1749300008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ALTER password_hash to NULLABLE (for OAuth users)
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN password_hash NVARCHAR(255) NULL`);

    // 2. Add email verification columns
    await queryRunner.query(`ALTER TABLE users ADD email_verified BIT NOT NULL CONSTRAINT df_users_email_verified DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE users ADD email_verify_token NVARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE users ADD email_verify_expires DATETIME2 NULL`);
    await queryRunner.query(`ALTER TABLE users ADD email_verify_count INT NOT NULL CONSTRAINT df_users_email_verify_count DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE users ADD email_verify_count_reset DATETIME2 NULL`);
    await queryRunner.query(`ALTER TABLE users ADD email_verify_attempts INT NOT NULL CONSTRAINT df_users_email_verify_attempts DEFAULT 0`);

    // 3. Add password reset columns
    await queryRunner.query(`ALTER TABLE users ADD password_reset_token_hash NVARCHAR(255) NULL`);
    await queryRunner.query(`ALTER TABLE users ADD password_reset_expires_at DATETIME2 NULL`);

    // 4. Backfill: existing users are considered verified
    await queryRunner.query(`UPDATE users SET email_verified = 1`);

    // 5. Filtered indexes (only index non-NULL rows)
    await queryRunner.query(`
      CREATE INDEX idx_users_email_verify_token
      ON users(email_verify_token)
      WHERE email_verify_token IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX idx_users_password_reset_token_hash
      ON users(password_reset_token_hash)
      WHERE password_reset_token_hash IS NOT NULL
    `);

    // 6. Create user_auth_providers table (multi-provider OAuth)
    await queryRunner.query(`
      CREATE TABLE user_auth_providers (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NOT NULL,
        provider NVARCHAR(20) NOT NULL,
        provider_id NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_uap_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_user_auth_providers PRIMARY KEY (id),
        CONSTRAINT fk_uap_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT uq_uap_provider_provider_id UNIQUE (provider, provider_id),
        CONSTRAINT uq_uap_user_provider UNIQUE (user_id, provider)
      )
    `);

    // 7. Create oauth_codes table (temporary one-time codes for OAuth exchange)
    await queryRunner.query(`
      CREATE TABLE oauth_codes (
        id INT IDENTITY(1,1) NOT NULL,
        code_hash NVARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        expires_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_oauth_codes_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_oauth_codes PRIMARY KEY (id),
        CONSTRAINT fk_oauth_codes_user_id FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_oauth_codes_code_hash ON oauth_codes(code_hash)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables (reverse order of creation)
    await queryRunner.query(`DROP INDEX idx_oauth_codes_code_hash ON oauth_codes`);
    await queryRunner.query(`DROP TABLE oauth_codes`);
    await queryRunner.query(`DROP TABLE user_auth_providers`);

    // Drop filtered indexes
    await queryRunner.query(`DROP INDEX idx_users_password_reset_token_hash ON users`);
    await queryRunner.query(`DROP INDEX idx_users_email_verify_token ON users`);

    // Drop password reset columns
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT df_users_email_verify_attempts`);
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT df_users_email_verify_count`);
    await queryRunner.query(`ALTER TABLE users DROP CONSTRAINT df_users_email_verified`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN password_reset_expires_at`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN password_reset_token_hash`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verify_attempts`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verify_count_reset`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verify_count`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verify_expires`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verify_token`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN email_verified`);

    // Restore password_hash to NOT NULL (must handle NULLs first)
    await queryRunner.query(`UPDATE users SET password_hash = '' WHERE password_hash IS NULL`);
    await queryRunner.query(`ALTER TABLE users ALTER COLUMN password_hash NVARCHAR(255) NOT NULL`);
  }
}
