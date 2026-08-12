import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const OrderTrackingSeed: ISeed = {
  name: 'order-tracking',
  order: 5,
  tables: ['order_tracking_locations', 'order_status_history'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // Status history for completed orders (1,2,3,4,6,7,8,9,10,11,12,14,15,16,17,18,21,22)
    // These orders went: pending → confirmed → shipping → delivered → completed
    await qr.query(`
      INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, actor_type, created_at) VALUES
        -- Order 1: completed flow (user_id=2, shipper_id=16)
        (1, NULL,        N'pending',   2,    N'CUSTOMER', '2026-03-05T09:15:00'),
        (1, N'pending',  N'confirmed', NULL, N'SYSTEM',   '2026-03-05T10:00:00'),
        (1, N'confirmed',N'shipping',  16,   N'SHIPPER',  '2026-03-06T08:00:00'),
        (1, N'shipping', N'delivered', 16,   N'SHIPPER',  '2026-03-06T14:30:00'),
        (1, N'delivered',N'completed', NULL, N'SYSTEM',   '2026-03-13T14:30:00'),

        -- Order 3: completed flow (user_id=3, shipper_id=16)
        (3, NULL,        N'pending',   3,    N'CUSTOMER', '2026-03-08T14:30:00'),
        (3, N'pending',  N'confirmed', NULL, N'SYSTEM',   '2026-03-08T15:00:00'),
        (3, N'confirmed',N'shipping',  16,   N'SHIPPER',  '2026-03-09T09:00:00'),
        (3, N'shipping', N'delivered', 16,   N'SHIPPER',  '2026-03-09T16:00:00'),
        (3, N'delivered',N'completed', NULL, N'SYSTEM',   '2026-03-16T16:00:00'),

        -- Order 5: cancelled (user_id=5)
        (5, NULL,        N'pending',   5,    N'CUSTOMER', '2026-03-15T16:20:00'),
        (5, N'pending',  N'cancelled', 5,    N'CUSTOMER', '2026-03-15T17:00:00'),

        -- Shipping orders: pending → confirmed → shipping (orders 19,20,23,25,26,33)
        (19, NULL,        N'pending',   2,  N'CUSTOMER', '2026-05-25T09:00:00'),
        (19, N'pending',  N'confirmed', NULL, N'SYSTEM', '2026-05-25T10:00:00'),
        (19, N'confirmed',N'shipping',  16, N'SHIPPER',  '2026-05-26T08:00:00'),

        (20, NULL,        N'pending',   2,  N'CUSTOMER', '2026-05-25T09:00:00'),
        (20, N'pending',  N'confirmed', NULL, N'SYSTEM', '2026-05-25T10:00:00'),
        (20, N'confirmed',N'shipping',  16, N'SHIPPER',  '2026-05-26T08:00:00'),

        (23, NULL,        N'pending',   6,  N'CUSTOMER', '2026-06-10T14:00:00'),
        (23, N'pending',  N'confirmed', NULL, N'SYSTEM', '2026-06-10T15:00:00'),
        (23, N'confirmed',N'shipping',  16, N'SHIPPER',  '2026-06-11T09:00:00'),

        (25, NULL,        N'pending',   7,  N'CUSTOMER', '2026-06-15T10:00:00'),
        (25, N'pending',  N'confirmed', NULL, N'SYSTEM', '2026-06-15T11:00:00'),
        (25, N'confirmed',N'shipping',  16, N'SHIPPER',  '2026-06-16T08:30:00'),

        (33, NULL,        N'pending',   2,  N'CUSTOMER', '2026-07-20T10:00:00'),
        (33, N'pending',  N'confirmed', NULL, N'SYSTEM', '2026-07-20T11:00:00'),
        (33, N'confirmed',N'shipping',  16, N'SHIPPER',  '2026-07-21T08:00:00');
    `);
    console.log('  + order_status_history: 27 rows');

    // Tracking locations for shipping orders (shipper location updates)
    await qr.query(`
      INSERT INTO order_tracking_locations (order_id, latitude, longitude, created_at) VALUES
        -- Order 19: shipper moving in HCMC
        (19, 10.7769, 106.7009, '2026-05-26T08:15:00'),
        (19, 10.7750, 106.6950, '2026-05-26T09:00:00'),
        (19, 10.7720, 106.6880, '2026-05-26T10:30:00'),

        -- Order 20: shipper moving in HCMC
        (20, 10.7769, 106.7009, '2026-05-26T08:15:00'),
        (20, 10.7730, 106.6920, '2026-05-26T09:30:00'),

        -- Order 23: shipper in Hanoi
        (23, 21.0285, 105.8542, '2026-06-11T09:30:00'),
        (23, 21.0250, 105.8500, '2026-06-11T10:15:00'),

        -- Order 25: shipper in Da Nang
        (25, 16.0544, 108.2022, '2026-06-16T09:00:00'),

        -- Order 33: shipper in HCMC
        (33, 10.7626, 106.6602, '2026-07-21T08:30:00'),
        (33, 10.7700, 106.6700, '2026-07-21T09:15:00');
    `);
    console.log('  + order_tracking_locations: 10 rows');

    await qr.release();
  },
};
