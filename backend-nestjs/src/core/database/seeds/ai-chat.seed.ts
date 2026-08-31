import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

/**
 * Seeds the AI Chatbox (Module 21):
 * - `ai_settings` — one row (chatbox enabled, default prompt).
 * - a couple of `ai_conversations` + `ai_messages` (customer + guest) so the
 *   Admin history page and thread-resume have meaningful demo data.
 */
export const AiChatSeed: ISeed = {
  name: 'ai-chat',
  order: 12,
  tables: ['ai_messages', 'ai_conversations', 'ai_settings'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT ai_settings ON;
      INSERT INTO ai_settings (id, chatbox_enabled, system_prompt) VALUES
        (1, 1, NULL);
      SET IDENTITY_INSERT ai_settings OFF;
    `);
    console.log('  + ai_settings: 1 row');

    // Conversation 1: customer #2. Conversation 2: guest session.
    await qr.query(`
      SET IDENTITY_INSERT ai_conversations ON;
      INSERT INTO ai_conversations (id, user_id, session_id, title, created_at, updated_at) VALUES
        (1, 2,    NULL,           N'Tìm áo thun nam đen giá rẻ', '2026-08-30T09:00:00', '2026-08-30T09:01:00'),
        (2, NULL, N'seed-guest-1', N'Chính sách đổi trả',         '2026-08-30T10:00:00', '2026-08-30T10:00:30');
      SET IDENTITY_INSERT ai_conversations OFF;
    `);
    console.log('  + ai_conversations: 2 rows');

    await qr.query(`
      SET IDENTITY_INSERT ai_messages ON;
      INSERT INTO ai_messages (id, conversation_id, role, content, product_ids, created_at) VALUES
        (1, 1, N'user',      N'Tôi cần áo thun nam màu đen giá dưới 300k', NULL,        '2026-08-30T09:00:00'),
        (2, 1, N'assistant', N'Dạ, bên mình có vài mẫu áo thun nam đen phù hợp ngân sách của bạn ạ.', N'[1,2]', '2026-08-30T09:00:05'),
        (3, 2, N'user',      N'Chính sách đổi trả của shop thế nào?',       NULL,        '2026-08-30T10:00:00'),
        (4, 2, N'assistant', N'Bạn có thể yêu cầu trả hàng trong vòng 7 ngày kể từ khi nhận hàng nhé.', NULL, '2026-08-30T10:00:30');
      SET IDENTITY_INSERT ai_messages OFF;
    `);
    console.log('  + ai_messages: 4 rows');

    await qr.release();
  },
};
