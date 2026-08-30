import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTables1756600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE conversations (
        id INT IDENTITY(1,1) NOT NULL,
        customer_id INT NOT NULL,
        shop_id INT NOT NULL,
        last_message_at DATETIME2 NULL,
        last_message_preview NVARCHAR(255) NULL,
        customer_unread INT NOT NULL CONSTRAINT df_conversations_customer_unread DEFAULT 0,
        seller_unread INT NOT NULL CONSTRAINT df_conversations_seller_unread DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT df_conversations_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_conversations PRIMARY KEY (id),
        CONSTRAINT uq_conversations_customer_shop UNIQUE (customer_id, shop_id),
        CONSTRAINT fk_conversations_customer_id FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_conversations_shop_id FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_conversations_customer_id ON conversations(customer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_conversations_shop_id ON conversations(shop_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE messages (
        id INT IDENTITY(1,1) NOT NULL,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_type NVARCHAR(20) NOT NULL,
        content NVARCHAR(2000) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT df_messages_status DEFAULT 'sent',
        created_at DATETIME2 NOT NULL CONSTRAINT df_messages_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_messages PRIMARY KEY (id),
        CONSTRAINT fk_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_id ON messages(conversation_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_messages_conversation_created ON messages`);
    await queryRunner.query(`DROP INDEX idx_messages_conversation_id ON messages`);
    await queryRunner.query(`DROP TABLE messages`);
    await queryRunner.query(`DROP INDEX idx_conversations_shop_id ON conversations`);
    await queryRunner.query(`DROP INDEX idx_conversations_customer_id ON conversations`);
    await queryRunner.query(`DROP TABLE conversations`);
  }
}
