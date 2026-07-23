import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTransactionsTable1749300009000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payment_transactions (
        id INT IDENTITY(1,1) NOT NULL,
        order_id INT NOT NULL,
        transaction_ref NVARCHAR(100) NOT NULL,
        gateway NVARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT df_payment_transactions_status DEFAULT 'pending',
        gateway_transaction_id NVARCHAR(100) NULL,
        gateway_response NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_payment_transactions_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT df_payment_transactions_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_payment_transactions PRIMARY KEY (id),
        CONSTRAINT fk_payment_transactions_order_id FOREIGN KEY (order_id) REFERENCES orders(id),
        CONSTRAINT uq_payment_transactions_transaction_ref UNIQUE (transaction_ref)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_payment_transactions_status ON payment_transactions(status)`,
    );

    await queryRunner.query(
      `UPDATE orders SET payment_method = 'vnpay' WHERE payment_method = 'banking'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE orders SET payment_method = 'banking' WHERE payment_method = 'vnpay'`,
    );
    await queryRunner.query(
      `DROP INDEX idx_payment_transactions_status ON payment_transactions`,
    );
    await queryRunner.query(
      `DROP INDEX idx_payment_transactions_order_id ON payment_transactions`,
    );
    await queryRunner.query(`DROP TABLE payment_transactions`);
  }
}
