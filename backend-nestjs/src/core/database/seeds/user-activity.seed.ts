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
      (2, NULL, 'VIEW_PRODUCT',    'product',  1,    NULL, '2026-08-22T09:10:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  2,    NULL, '2026-08-22T09:12:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  3,    NULL, '2026-08-23T14:00:00'),
      (2, NULL, 'VIEW_CATEGORY',   'category', 15,   NULL, '2026-08-23T14:01:00'),
      (2, NULL, 'ADD_TO_CART',     'product',  1,    NULL, '2026-08-24T10:30:00'),
      (2, NULL, 'ADD_TO_WISHLIST', 'product',  2,    NULL, '2026-08-24T10:31:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  4,    NULL, '2026-08-26T20:00:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  6,    NULL, '2026-08-26T20:05:00'),
      (2, NULL, 'PURCHASE',        'product',  3,    NULL, '2026-08-28T11:00:00'),
      (2, NULL, 'SEARCH',          'search',   NULL, '{"keyword":"áo thun nam"}', '2026-08-30T08:00:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  5,    NULL, '2026-09-01T19:00:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  7,    NULL, '2026-09-02T19:10:00'),
      (2, NULL, 'VIEW_PRODUCT',    'product',  1,    NULL, '2026-09-03T21:00:00'),

      -- user 3 · electronics
      (3, NULL, 'VIEW_PRODUCT',    'product',  8,    NULL, '2026-08-21T09:00:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  9,    NULL, '2026-08-21T09:05:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  10,   NULL, '2026-08-22T13:00:00'),
      (3, NULL, 'VIEW_CATEGORY',   'category', 8,    NULL, '2026-08-22T13:01:00'),
      (3, NULL, 'ADD_TO_CART',     'product',  8,    NULL, '2026-08-23T15:20:00'),
      (3, NULL, 'ADD_TO_WISHLIST', 'product',  10,   NULL, '2026-08-24T16:00:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  12,   NULL, '2026-08-27T11:30:00'),
      (3, NULL, 'PURCHASE',        'product',  12,   NULL, '2026-08-29T10:00:00'),
      (3, NULL, 'SEARCH',          'search',   NULL, '{"keyword":"laptop"}', '2026-08-31T08:30:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  11,   NULL, '2026-09-01T20:00:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  13,   NULL, '2026-09-02T20:30:00'),
      (3, NULL, 'VIEW_PRODUCT',    'product',  8,    NULL, '2026-09-03T22:00:00'),

      -- user 4 · books + electronics overlap
      (4, NULL, 'VIEW_PRODUCT',    'product',  18,   NULL, '2026-08-20T08:00:00'),
      (4, NULL, 'VIEW_PRODUCT',    'product',  19,   NULL, '2026-08-20T08:10:00'),
      (4, NULL, 'VIEW_PRODUCT',    'product',  20,   NULL, '2026-08-21T09:00:00'),
      (4, NULL, 'VIEW_CATEGORY',   'category', 13,   NULL, '2026-08-21T09:01:00'),
      (4, NULL, 'ADD_TO_WISHLIST', 'product',  20,   NULL, '2026-08-22T10:00:00'),
      (4, NULL, 'ADD_TO_CART',     'product',  18,   NULL, '2026-08-23T11:00:00'),
      (4, NULL, 'PURCHASE',        'product',  19,   NULL, '2026-08-26T12:00:00'),
      (4, NULL, 'VIEW_PRODUCT',    'product',  10,   NULL, '2026-08-28T18:00:00'),
      (4, NULL, 'VIEW_PRODUCT',    'product',  8,    NULL, '2026-08-28T18:05:00'),
      (4, NULL, 'SEARCH',          'search',   NULL, '{"keyword":"sách kỹ năng"}', '2026-08-30T07:00:00'),
      (4, NULL, 'VIEW_PRODUCT',    'product',  1,    NULL, '2026-09-02T21:00:00'),

      -- user 5 · electronics overlap with user 3 (co-view on 8/9)
      (5, NULL, 'VIEW_PRODUCT',    'product',  8,    NULL, '2026-08-25T09:00:00'),
      (5, NULL, 'VIEW_PRODUCT',    'product',  9,    NULL, '2026-08-25T09:10:00'),
      (5, NULL, 'VIEW_PRODUCT',    'product',  10,   NULL, '2026-08-26T10:00:00'),
      (5, NULL, 'ADD_TO_CART',     'product',  9,    NULL, '2026-08-27T14:00:00'),
      (5, NULL, 'VIEW_CATEGORY',   'category', 9,    NULL, '2026-08-27T14:01:00'),
      (5, NULL, 'VIEW_PRODUCT',    'product',  11,   NULL, '2026-08-29T20:00:00'),
      (5, NULL, 'VIEW_PRODUCT',    'product',  13,   NULL, '2026-09-01T21:00:00'),
      (5, NULL, 'PURCHASE',        'product',  9,    NULL, '2026-09-03T10:00:00'),

      -- guest session · fashion (drives guest recommendations by x-session-id)
      (NULL, 'demo-session-guest-1', 'VIEW_PRODUCT',  'product',  1,  NULL, '2026-09-02T10:00:00'),
      (NULL, 'demo-session-guest-1', 'VIEW_PRODUCT',  'product',  2,  NULL, '2026-09-02T10:05:00'),
      (NULL, 'demo-session-guest-1', 'VIEW_CATEGORY', 'category', 15, NULL, '2026-09-02T10:06:00'),
      (NULL, 'demo-session-guest-1', 'ADD_TO_CART',   'product',  3,  NULL, '2026-09-03T11:00:00'),
      (NULL, 'demo-session-guest-1', 'VIEW_PRODUCT',  'product',  6,  NULL, '2026-09-04T09:00:00');
    `);
    console.log('  + user_activity_log: 50 rows (4 customers + 1 guest session)');

    // ── Co-view reinforcement (Module 22 "Similar Products") ──
    // Extra VIEW_PRODUCT rows so more product PAIRS are co-viewed by ≥2 distinct
    // owners → they clear the co-view min-support threshold (≥2) instead of always
    // falling back. Reinforces books (18/19/20 — previously single-owner) and
    // fashion (1/2/3), plus a books↔electronics cross session.
    await qr.query(`
      INSERT INTO user_activity_log
        (user_id, session_id, action, target_type, target_id, metadata, created_at) VALUES
      -- user 2 · adds product 3 so Áo sơ mi gains a second viewer (co-view with user 6)
      (2, NULL, 'VIEW_PRODUCT', 'product', 3, NULL, '2026-09-05T21:30:00'),

      -- user 6 · fashion (co-view with user 2 / guest-1 on 1/2/3)
      (6, NULL, 'VIEW_PRODUCT',  'product',  1,  NULL, '2026-09-05T10:00:00'),
      (6, NULL, 'VIEW_PRODUCT',  'product',  2,  NULL, '2026-09-05T10:05:00'),
      (6, NULL, 'VIEW_PRODUCT',  'product',  3,  NULL, '2026-09-05T10:10:00'),
      (6, NULL, 'VIEW_CATEGORY', 'category', 15, NULL, '2026-09-05T10:11:00'),

      -- user 7 · books (co-view with user 4 → 18/19/20 clear min-support)
      (7, NULL, 'VIEW_PRODUCT', 'product', 18, NULL, '2026-09-06T09:00:00'),
      (7, NULL, 'VIEW_PRODUCT', 'product', 19, NULL, '2026-09-06T09:05:00'),
      (7, NULL, 'VIEW_PRODUCT', 'product', 20, NULL, '2026-09-06T09:10:00'),

      -- guest session 2 · books + electronics cross (more co-view mass)
      (NULL, 'demo-session-guest-2', 'VIEW_PRODUCT', 'product', 18, NULL, '2026-09-07T11:00:00'),
      (NULL, 'demo-session-guest-2', 'VIEW_PRODUCT', 'product', 19, NULL, '2026-09-07T11:05:00'),
      (NULL, 'demo-session-guest-2', 'VIEW_PRODUCT', 'product', 8,  NULL, '2026-09-07T11:10:00'),
      (NULL, 'demo-session-guest-2', 'VIEW_PRODUCT', 'product', 13, NULL, '2026-09-07T11:15:00');
    `);
    console.log('  + user_activity_log: +12 co-view reinforcement rows');

    await qr.release();
  },
};
