import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const CouponSeed: ISeed = {
  name: 'coupon',
  order: 6,
  tables: ['coupon_usages', 'coupon_products', 'coupon_categories', 'coupons'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // current_uses reflects actual coupon_usages from seeded orders
    await qr.query(`
      INSERT INTO coupons (id, code, description, discount_type, discount_value, scope, min_order_amount, max_discount_amount, max_uses, max_uses_per_user, current_uses, starts_at, expires_at, is_active) VALUES
        (1, 'WELCOME10',    'Giảm 10% cho khách hàng mới',         'percentage', 10,     'all',        200000,   100000, NULL, 1, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', true),
        (2, 'FASHION20',    'Giảm 20% cho thời trang',             'percentage', 20,     'categories', 300000,   200000, 500,  2, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', true),
        (3, 'TECH50K',      'Giảm 50K cho điện tử',                'fixed',      50000,  'categories', 1000000,  NULL,   200,  1, 0,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', true),
        (4, 'BOOK30',       'Giảm 30% cho sách',                   'percentage', 30,     'products',   100000,   50000,  NULL, 3, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', true),
        (5, 'FREESHIP',     'Miễn phí vận chuyển (giảm 30K)',      'fixed',      30000,  'all',        500000,   NULL,   1000, 1, 1,
          '2026-06-01T00:00:00', '2026-06-30T23:59:59', true);
    `);
    console.log('  + coupons: 5 rows');

    await qr.query(`
      INSERT INTO coupon_categories (id, coupon_id, category_id) VALUES
        (1, 2, 1),
        (2, 2, 5),
        (3, 2, 6),
        (4, 2, 7),
        (5, 2, 15),
        (6, 2, 16),
        (7, 3, 2),
        (8, 3, 8),
        (9, 3, 9),
        (10, 3, 10);
    `);
    console.log('  + coupon_categories: 10 rows');

    await qr.query(`
      INSERT INTO coupon_products (id, coupon_id, product_id) VALUES
        (1, 4, 18),
        (2, 4, 19),
        (3, 4, 20);
    `);
    console.log('  + coupon_products: 3 rows');

    // Coupon usage audit trail matching seeded orders (multi-shop splits = 1 usage per sub-order)
    // Group E (orders 7-8): WELCOME10 discount 100000 split proportionally (24000 + 76000)
    // Order 14: FREESHIP discount 30000 (single-shop order)
    // Group F (orders 16-17): FASHION20 discount 95800 split proportionally (44600 + 51200)
    // Group I (order 25 only): BOOK30 discount 33000 (only books shop gets coupon, shirt shop gets none)
    await qr.query(`
      INSERT INTO coupon_usages (id, coupon_id, user_id, order_id, discount_amount, status, created_at) VALUES
        (1, 1, 6,  7,  24000,  'applied', '2026-03-25T08:30:00'),
        (2, 1, 6,  8,  76000,  'applied', '2026-03-25T08:30:00'),
        (3, 5, 2,  14, 30000,  'applied', '2026-04-22T14:20:00'),
        (4, 2, 7,  16, 44600,  'applied', '2026-05-02T16:30:00'),
        (5, 2, 7,  17, 51200,  'applied', '2026-05-02T16:30:00'),
        (6, 4, 6,  25, 33000,  'applied', '2026-05-28T08:15:00');
    `);
    console.log('  + coupon_usages: 6 rows');

    await qr.release();
  },
};
