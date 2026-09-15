import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiChatTables1756700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE ai_conversations (
        id INT IDENTITY(1,1) NOT NULL,
        user_id INT NULL,
        session_id NVARCHAR(100) NULL,
        title NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_ai_conversations_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT df_ai_conversations_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_ai_conversations PRIMARY KEY (id),
        CONSTRAINT fk_ai_conversations_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_ai_conversations_session_id ON ai_conversations(session_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE ai_messages (
        id INT IDENTITY(1,1) NOT NULL,
        conversation_id INT NOT NULL,
        role NVARCHAR(20) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        product_ids NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT df_ai_messages_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_ai_messages PRIMARY KEY (id),
        CONSTRAINT fk_ai_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at)`,
    );

    await queryRunner.query(`
      CREATE TABLE ai_settings (
        id INT IDENTITY(1,1) NOT NULL,
        chatbox_enabled BIT NOT NULL CONSTRAINT df_ai_settings_chatbox_enabled DEFAULT 1,
        system_prompt NVARCHAR(MAX) NULL,
        updated_at DATETIME2 NOT NULL CONSTRAINT df_ai_settings_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_ai_settings PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(
      `INSERT INTO ai_settings (chatbox_enabled, system_prompt) VALUES (1, NULL)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE ai_messages`);
    await queryRunner.query(`DROP TABLE ai_conversations`);
    await queryRunner.query(`DROP TABLE ai_settings`);
  }
}
