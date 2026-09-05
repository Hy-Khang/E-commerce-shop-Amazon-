import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

/**
 * Seeds `user_activity_log` (Smart Recommendations — Module 22) with ~55 rows
 * across 4 demo customers so "Recommended for You", co-view "Similar", and the
 * reason label are all non-empty in a demo. All timestamps are recent (within
 * the 90-day scoring window relative to the seed date).
 *
 * Demo personas (drives the scoring):
 *  - user 2 → fashion (categories 15/16/6/7): views + cart + wishlist + a purchase
 *  - user 3 → electronics (categories 8/9/10): views + cart + a purchase
 *  - user 4 → books (categories 13/14) + some electronics overlap (co-view)
 *  - user 5 → electronics overlap with user 3 (co-view on products 8/9)
 */
export const UserActivitySeed: ISeed = {
  name: 'user-activity',
  order: 13,
  tables: ['user_activity_log'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      INSERT INTO user_activity_log
        (user_id, session_id, action, target_type, target_id, metadata, created_at) VALUES
      -- user 2 · fashion
      (2, NULL, N'VIEW_PRODUCT',    N'product',  1,    NULL, '2026-08-22T09:10:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  2,    NULL, '2026-08-22T09:12:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  3,    NULL, '2026-08-23T14:00:00'),
      (2, NULL, N'VIEW_CATEGORY',   N'category', 15,   NULL, '2026-08-23T14:01:00'),
      (2, NULL, N'ADD_TO_CART',     N'product',  1,    NULL, '2026-08-24T10:30:00'),
      (2, NULL, N'ADD_TO_WISHLIST', N'product',  2,    NULL, '2026-08-24T10:31:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  4,    NULL, '2026-08-26T20:00:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  6,    NULL, '2026-08-26T20:05:00'),
      (2, NULL, N'PURCHASE',        N'product',  3,    NULL, '2026-08-28T11:00:00'),
      (2, NULL, N'SEARCH',          N'search',   NULL, N'{"keyword":"áo thun nam"}', '2026-08-30T08:00:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  5,    NULL, '2026-09-01T19:00:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  7,    NULL, '2026-09-02T19:10:00'),
      (2, NULL, N'VIEW_PRODUCT',    N'product',  1,    NULL, '2026-09-03T21:00:00'),

      -- user 3 · electronics
      (3, NULL, N'VIEW_PRODUCT',    N'product',  8,    NULL, '2026-08-21T09:00:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  9,    NULL, '2026-08-21T09:05:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  10,   NULL, '2026-08-22T13:00:00'),
      (3, NULL, N'VIEW_CATEGORY',   N'category', 8,    NULL, '2026-08-22T13:01:00'),
      (3, NULL, N'ADD_TO_CART',     N'product',  8,    NULL, '2026-08-23T15:20:00'),
      (3, NULL, N'ADD_TO_WISHLIST', N'product',  10,   NULL, '2026-08-24T16:00:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  12,   NULL, '2026-08-27T11:30:00'),
      (3, NULL, N'PURCHASE',        N'product',  12,   NULL, '2026-08-29T10:00:00'),
      (3, NULL, N'SEARCH',          N'search',   NULL, N'{"keyword":"laptop"}', '2026-08-31T08:30:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  11,   NULL, '2026-09-01T20:00:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  13,   NULL, '2026-09-02T20:30:00'),
      (3, NULL, N'VIEW_PRODUCT',    N'product',  8,    NULL, '2026-09-03T22:00:00'),

      -- user 4 · books + electronics overlap
      (4, NULL, N'VIEW_PRODUCT',    N'product',  18,   NULL, '2026-08-20T08:00:00'),
      (4, NULL, N'VIEW_PRODUCT',    N'product',  19,   NULL, '2026-08-20T08:10:00'),
      (4, NULL, N'VIEW_PRODUCT',    N'product',  20,   NULL, '2026-08-21T09:00:00'),
      (4, NULL, N'VIEW_CATEGORY',   N'category', 13,   NULL, '2026-08-21T09:01:00'),
      (4, NULL, N'ADD_TO_WISHLIST', N'product',  20,   NULL, '2026-08-22T10:00:00'),
      (4, NULL, N'ADD_TO_CART',     N'product',  18,   NULL, '2026-08-23T11:00:00'),
      (4, NULL, N'PURCHASE',        N'product',  19,   NULL, '2026-08-26T12:00:00'),
      (4, NULL, N'VIEW_PRODUCT',    N'product',  10,   NULL, '2026-08-28T18:00:00'),
      (4, NULL, N'VIEW_PRODUCT',    N'product',  8,    NULL, '2026-08-28T18:05:00'),
      (4, NULL, N'SEARCH',          N'search',   NULL, N'{"keyword":"sách kỹ năng"}', '2026-08-30T07:00:00'),
      (4, NULL, N'VIEW_PRODUCT',    N'product',  1,    NULL, '2026-09-02T21:00:00'),

      -- user 5 · electronics overlap with user 3 (co-view on 8/9)
      (5, NULL, N'VIEW_PRODUCT',    N'product',  8,    NULL, '2026-08-25T09:00:00'),
      (5, NULL, N'VIEW_PRODUCT',    N'product',  9,    NULL, '2026-08-25T09:10:00'),
      (5, NULL, N'VIEW_PRODUCT',    N'product',  10,   NULL, '2026-08-26T10:00:00'),
      (5, NULL, N'ADD_TO_CART',     N'product',  9,    NULL, '2026-08-27T14:00:00'),
      (5, NULL, N'VIEW_CATEGORY',   N'category', 9,    NULL, '2026-08-27T14:01:00'),
      (5, NULL, N'VIEW_PRODUCT',    N'product',  11,   NULL, '2026-08-29T20:00:00'),
      (5, NULL, N'VIEW_PRODUCT',    N'product',  13,   NULL, '2026-09-01T21:00:00'),
      (5, NULL, N'PURCHASE',        N'product',  9,    NULL, '2026-09-03T10:00:00'),

      -- guest session · fashion (drives guest recommendations by x-session-id)
      (NULL, N'demo-session-guest-1', N'VIEW_PRODUCT',  N'product',  1,  NULL, '2026-09-02T10:00:00'),
      (NULL, N'demo-session-guest-1', N'VIEW_PRODUCT',  N'product',  2,  NULL, '2026-09-02T10:05:00'),
      (NULL, N'demo-session-guest-1', N'VIEW_CATEGORY', N'category', 15, NULL, '2026-09-02T10:06:00'),
      (NULL, N'demo-session-guest-1', N'ADD_TO_CART',   N'product',  3,  NULL, '2026-09-03T11:00:00'),
      (NULL, N'demo-session-guest-1', N'VIEW_PRODUCT',  N'product',  6,  NULL, '2026-09-04T09:00:00');
    `);
    console.log('  + user_activity_log: 50 rows (4 customers + 1 guest session)');

    await qr.release();
  },
};
