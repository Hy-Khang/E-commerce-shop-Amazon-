import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

/**
 * Seeds the Hoàn Xu (coin) feature:
 * - `app_settings` — 4 coin.* config keys (enabled / earn rate / redeem cap / expiry)
 * - a few `coin_batches` + `coin_transactions` for 2 demo customers so the wallet
 *   page and redemption have meaningful data.
 */
export const CoinSeed: ISeed = {
  name: 'coin',
  order: 11,
  tables: ['coin_transactions', 'coin_batches', 'app_settings'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      INSERT INTO app_settings ([key], value) VALUES
        ('coin.enabled',            'true'),
        ('coin.earn_rate_percent',  '1'),
        ('coin.redeem_max_percent', '50'),
        ('coin.expiry_days',        '90'),
        ('commission.enabled',      'true'),
        ('commission.mode',         'flat'),
        ('commission.rate_percent', '10');
    `);
    console.log('  + app_settings: 4 coin.* + 3 commission.* keys');

    // Active batches (future expiry) for customers #2 and #3. 1 Xu = 1 VND.
    await qr.query(`
      INSERT INTO coin_batches (id, user_id, source_order_id, amount_earned, amount_remaining, earned_at, expires_at, status) VALUES
        (1, 2, NULL, 15000, 15000, '2026-08-01T09:00:00', '2026-12-01T09:00:00', 'active'),
        (2, 2, NULL,  5000,  3000, '2026-08-10T09:00:00', '2026-12-10T09:00:00', 'active'),
        (3, 3, NULL, 20000, 20000, '2026-08-05T09:00:00', '2026-11-05T09:00:00', 'active');
    `);
    console.log('  + coin_batches: 3 rows');

    await qr.query(`
      INSERT INTO coin_transactions (id, user_id, type, amount, order_id, batch_id, note, created_at) VALUES
        (1, 2, 'earn',   15000, NULL, 1, 'Earned from completed order', '2026-08-01T09:00:00'),
        (2, 2, 'earn',    5000, NULL, 2, 'Earned from completed order', '2026-08-10T09:00:00'),
        (3, 2, 'redeem',  2000, NULL, 2, 'Redeemed at checkout',        '2026-08-15T10:00:00'),
        (4, 3, 'earn',   20000, NULL, 3, 'Earned from completed order', '2026-08-05T09:00:00');
    `);
    console.log('  + coin_transactions: 4 rows');

    await qr.release();
  },
};
