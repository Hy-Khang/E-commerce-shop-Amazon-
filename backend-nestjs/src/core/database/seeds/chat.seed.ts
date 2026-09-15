import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

/**
 * Sample Customer ↔ Seller conversations so the chat UI has content on first
 * run. Customers: users 2, 3, 4. Shops: 1 (owner user 9), 2 (owner user 10),
 * 4 (owner user 12). `sender_type` matches the sender's side; the two unread
 * counters + message `status` are set to demo read receipts and both badges.
 */
export const ChatSeed: ISeed = {
  name: 'chat',
  order: 10,
  tables: ['conversations', 'messages'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // Conversations — one row per (customer, shop) pair.
    await qr.query(`
      INSERT INTO conversations
        (id, customer_id, shop_id, last_message_at, last_message_preview, customer_unread, seller_unread, created_at) VALUES
        -- Customer 2 ↔ Shop 1 (owner 9): last msg from customer, seller has 1 unread
        (1, 2, 1, '2026-08-28T09:07:00', 'Vậy cho mình đặt 1 áo size M đen nha shop.', 0, 1, '2026-08-28T09:00:00'),
        -- Customer 3 ↔ Shop 2 (owner 10): last msg from seller, customer has 1 unread
        (2, 3, 2, '2026-08-29T14:11:00', 'Bên mình đang có khuyến mãi tặng kèm chuột không dây nữa ạ.', 1, 0, '2026-08-29T14:00:00'),
        -- Customer 4 ↔ Shop 4 (owner 12): fully read on both sides
        (3, 4, 4, '2026-08-30T10:05:00', 'Ok mình lấy bản bìa cứng, cảm ơn shop!', 0, 0, '2026-08-30T10:00:00');
    `);
    console.log('  + conversations: 3 rows');

    // Messages — sender_id/sender_type match the sending side.
    await qr.query(`
      INSERT INTO messages
        (id, conversation_id, sender_id, sender_type, content, status, created_at) VALUES
        -- Conversation 1
        (1, 1, 2, 'customer', 'Shop ơi áo thun này còn size M màu đen không ạ?',        'read',      '2026-08-28T09:00:00'),
        (2, 1, 9, 'seller',   'Dạ còn đủ size bạn nhé, size M màu đen còn nhiều ạ.',    'read',      '2026-08-28T09:05:00'),
        (3, 1, 2, 'customer', 'Vậy cho mình đặt 1 áo size M đen nha shop.',             'delivered', '2026-08-28T09:07:00'),
        -- Conversation 2
        (4, 2, 3, 'customer', 'Laptop này còn bảo hành mấy năm shop?',                   'read',      '2026-08-29T14:00:00'),
        (5, 2, 10, 'seller',  'Bảo hành chính hãng 12 tháng bạn nhé, đổi mới trong 7 ngày.', 'read',  '2026-08-29T14:10:00'),
        (6, 2, 10, 'seller',  'Bên mình đang có khuyến mãi tặng kèm chuột không dây nữa ạ.', 'delivered', '2026-08-29T14:11:00'),
        -- Conversation 3
        (7, 3, 4, 'customer', 'Sách này có bản bìa cứng không shop?',                    'read',      '2026-08-30T10:00:00'),
        (8, 3, 12, 'seller',  'Dạ có bản bìa cứng bạn nhé, giá 150k ạ.',                 'read',      '2026-08-30T10:03:00'),
        (9, 3, 4, 'customer', 'Ok mình lấy bản bìa cứng, cảm ơn shop!',                  'read',      '2026-08-30T10:05:00');
    `);
    console.log('  + messages: 9 rows');

    await qr.release();
  },
};
