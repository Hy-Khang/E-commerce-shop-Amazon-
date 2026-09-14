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
      INSERT INTO ai_settings (id, chatbox_enabled, system_prompt) VALUES
        (1, true, NULL);
    `);
    console.log('  + ai_settings: 1 row');

    // Conversation 1: customer #2. Conversation 2: guest session.
    await qr.query(`
      INSERT INTO ai_conversations (id, user_id, session_id, title, created_at, updated_at) VALUES
        (1, 2,    NULL,           'Tìm áo thun nam đen giá rẻ', '2026-08-30T09:00:00', '2026-08-30T09:01:00'),
        (2, NULL, 'seed-guest-1', 'Chính sách đổi trả',         '2026-08-30T10:00:00', '2026-08-30T10:00:30');
    `);
    console.log('  + ai_conversations: 2 rows');

    await qr.query(`
      INSERT INTO ai_messages (id, conversation_id, role, content, product_ids, created_at) VALUES
        (1, 1, 'user',      'Tôi cần áo thun nam màu đen giá dưới 300k', NULL,        '2026-08-30T09:00:00'),
        (2, 1, 'assistant', 'Dạ, bên mình có vài mẫu áo thun nam đen phù hợp ngân sách của bạn ạ.', '[1,2]', '2026-08-30T09:00:05'),
        (3, 2, 'user',      'Chính sách đổi trả của shop thế nào?',       NULL,        '2026-08-30T10:00:00'),
        (4, 2, 'assistant', 'Bạn có thể yêu cầu trả hàng trong vòng 7 ngày kể từ khi nhận hàng nhé.', NULL, '2026-08-30T10:00:30');
    `);
    console.log('  + ai_messages: 4 rows');

    await qr.release();
  },
};
