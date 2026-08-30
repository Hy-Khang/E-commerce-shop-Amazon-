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
      SET IDENTITY_INSERT conversations ON;
      INSERT INTO conversations
        (id, customer_id, shop_id, last_message_at, last_message_preview, customer_unread, seller_unread, created_at) VALUES
        -- Customer 2 ↔ Shop 1 (owner 9): last msg from customer, seller has 1 unread
        (1, 2, 1, '2026-08-28T09:07:00', N'Vậy cho mình đặt 1 áo size M đen nha shop.', 0, 1, '2026-08-28T09:00:00'),
        -- Customer 3 ↔ Shop 2 (owner 10): last msg from seller, customer has 1 unread
        (2, 3, 2, '2026-08-29T14:11:00', N'Bên mình đang có khuyến mãi tặng kèm chuột không dây nữa ạ.', 1, 0, '2026-08-29T14:00:00'),
        -- Customer 4 ↔ Shop 4 (owner 12): fully read on both sides
        (3, 4, 4, '2026-08-30T10:05:00', N'Ok mình lấy bản bìa cứng, cảm ơn shop!', 0, 0, '2026-08-30T10:00:00');
      SET IDENTITY_INSERT conversations OFF;
    `);
    console.log('  + conversations: 3 rows');

    // Messages — sender_id/sender_type match the sending side.
    await qr.query(`
      SET IDENTITY_INSERT messages ON;
      INSERT INTO messages
        (id, conversation_id, sender_id, sender_type, content, status, created_at) VALUES
        -- Conversation 1
        (1, 1, 2, N'customer', N'Shop ơi áo thun này còn size M màu đen không ạ?',        N'read',      '2026-08-28T09:00:00'),
        (2, 1, 9, N'seller',   N'Dạ còn đủ size bạn nhé, size M màu đen còn nhiều ạ.',    N'read',      '2026-08-28T09:05:00'),
        (3, 1, 2, N'customer', N'Vậy cho mình đặt 1 áo size M đen nha shop.',             N'delivered', '2026-08-28T09:07:00'),
        -- Conversation 2
        (4, 2, 3, N'customer', N'Laptop này còn bảo hành mấy năm shop?',                   N'read',      '2026-08-29T14:00:00'),
        (5, 2, 10, N'seller',  N'Bảo hành chính hãng 12 tháng bạn nhé, đổi mới trong 7 ngày.', N'read',  '2026-08-29T14:10:00'),
        (6, 2, 10, N'seller',  N'Bên mình đang có khuyến mãi tặng kèm chuột không dây nữa ạ.', N'delivered', '2026-08-29T14:11:00'),
        -- Conversation 3
        (7, 3, 4, N'customer', N'Sách này có bản bìa cứng không shop?',                    N'read',      '2026-08-30T10:00:00'),
        (8, 3, 12, N'seller',  N'Dạ có bản bìa cứng bạn nhé, giá 150k ạ.',                 N'read',      '2026-08-30T10:03:00'),
        (9, 3, 4, N'customer', N'Ok mình lấy bản bìa cứng, cảm ơn shop!',                  N'read',      '2026-08-30T10:05:00');
      SET IDENTITY_INSERT messages OFF;
    `);
    console.log('  + messages: 9 rows');

    await qr.release();
  },
};
