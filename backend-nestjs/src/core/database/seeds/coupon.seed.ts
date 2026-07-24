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
      SET IDENTITY_INSERT coupons ON;
      INSERT INTO coupons (id, code, description, discount_type, discount_value, scope, min_order_amount, max_discount_amount, max_uses, max_uses_per_user, current_uses, starts_at, expires_at, is_active) VALUES
        (1, N'WELCOME10',    N'Giảm 10% cho khách hàng mới',         N'percentage', 10,     N'all',        200000,   100000, NULL, 1, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', 1),
        (2, N'FASHION20',    N'Giảm 20% cho thời trang',             N'percentage', 20,     N'categories', 300000,   200000, 500,  2, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', 1),
        (3, N'TECH50K',      N'Giảm 50K cho điện tử',                N'fixed',      50000,  N'categories', 1000000,  NULL,   200,  1, 0,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', 1),
        (4, N'BOOK30',       N'Giảm 30% cho sách',                   N'percentage', 30,     N'products',   100000,   50000,  NULL, 3, 1,
          '2026-01-01T00:00:00', '2026-12-31T23:59:59', 1),
        (5, N'FREESHIP',     N'Miễn phí vận chuyển (giảm 30K)',      N'fixed',      30000,  N'all',        500000,   NULL,   1000, 1, 1,
          '2026-06-01T00:00:00', '2026-06-30T23:59:59', 1);
      SET IDENTITY_INSERT coupons OFF;
    `);
    console.log('  + coupons: 5 rows');

    await qr.query(`
      SET IDENTITY_INSERT coupon_categories ON;
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
      SET IDENTITY_INSERT coupon_categories OFF;
    `);
    console.log('  + coupon_categories: 10 rows');

    await qr.query(`
      SET IDENTITY_INSERT coupon_products ON;
      INSERT INTO coupon_products (id, coupon_id, product_id) VALUES
        (1, 4, 18),
        (2, 4, 19),
        (3, 4, 20);
      SET IDENTITY_INSERT coupon_products OFF;
    `);
    console.log('  + coupon_products: 3 rows');

    // Coupon usage audit trail matching seeded orders
    await qr.query(`
      SET IDENTITY_INSERT coupon_usages ON;
      INSERT INTO coupon_usages (id, coupon_id, user_id, order_id, discount_amount, status, created_at) VALUES
        (1, 1, 6,  6,  100000, N'applied', '2026-03-25T08:30:00'),
        (2, 5, 2,  12, 30000,  N'applied', '2026-04-22T14:20:00'),
        (3, 2, 7,  14, 95800,  N'applied', '2026-05-02T16:30:00'),
        (4, 4, 6,  20, 33000,  N'applied', '2026-05-28T08:15:00');
      SET IDENTITY_INSERT coupon_usages OFF;
    `);
    console.log('  + coupon_usages: 4 rows');

    await qr.release();
  },
};
