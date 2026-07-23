import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const OrderSeed: ISeed = {
  name: 'order',
  order: 4,
  tables: ['order_items', 'orders'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // 25 orders spread across March–June 2026 with diverse statuses/payment/timelines
    await qr.query(`
      SET IDENTITY_INSERT orders ON;
      INSERT INTO orders (id, user_id, status, payment_method, payment_status, shipping_fee, total_amount, shipping_address, coupon_code, discount_amount, created_at) VALUES
        -- March 2026: mostly delivered
        (1,  2,  N'delivered',  N'cod',     N'paid',   30000,    678000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-03-05T09:15:00'),
        (2,  3,  N'delivered',  N'vnpay', N'paid',   0,        32990000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-03-08T14:30:00'),
        (3,  4,  N'delivered',  N'cod',     N'paid',   30000,    273000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng"}',
          NULL, 0, '2026-03-12T10:45:00'),
        (4,  5,  N'cancelled',  N'vnpay', N'unpaid', 30000,    509000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội"}',
          NULL, 0, '2026-03-15T16:20:00'),
        (5,  2,  N'delivered',  N'momo',    N'paid',   0,        6039000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-03-20T11:00:00'),
        (6,  14, N'delivered',  N'cod',     N'paid',   30000,    969000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000013","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội"}',
          N'WELCOME10', 100000, '2026-03-25T08:30:00'),
        (7,  15, N'delivered',  N'vnpay', N'paid',   0,        29990000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000014","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng"}',
          NULL, 0, '2026-03-30T15:45:00'),

        -- April 2026: mix of delivered and cancelled
        (8,  16, N'delivered',  N'cod',     N'paid',   30000,    4320000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000015","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-04-03T13:10:00'),
        (9,  3,  N'delivered',  N'momo',    N'paid',   30000,    1070000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-04-08T09:30:00'),
        (10, 4,  N'delivered',  N'vnpay', N'paid',   0,        26490000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng"}',
          NULL, 0, '2026-04-12T17:00:00'),
        (11, 5,  N'cancelled',  N'cod',     N'unpaid', 30000,    669000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội"}',
          NULL, 0, '2026-04-18T10:15:00'),
        (12, 2,  N'delivered',  N'vnpay', N'paid',   30000,    2339000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"456 Nguyễn Huệ, Quận 1","city":"Hồ Chí Minh"}',
          N'FREESHIP', 30000, '2026-04-22T14:20:00'),
        (13, 14, N'delivered',  N'cod',     N'paid',   30000,    287000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000013","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội"}',
          NULL, 0, '2026-04-28T11:45:00'),

        -- May 2026: mix of delivered, shipping, confirmed
        (14, 15, N'delivered',  N'momo',    N'paid',   30000,    962200,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000014","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng"}',
          N'FASHION20', 95800, '2026-05-02T16:30:00'),
        (15, 16, N'delivered',  N'vnpay', N'paid',   0,        33490000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000015","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-05-07T09:00:00'),
        (16, 3,  N'shipping',   N'cod',     N'unpaid', 30000,    969000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-05-12T12:30:00'),
        (17, 4,  N'delivered',  N'vnpay', N'paid',   30000,    1369000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng"}',
          NULL, 0, '2026-05-15T14:00:00'),
        (18, 2,  N'shipping',   N'cod',     N'unpaid', 30000,    1620000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-05-20T10:45:00'),
        (19, 5,  N'confirmed',  N'vnpay', N'paid',   0,        32990000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội"}',
          NULL, 0, '2026-05-25T15:20:00'),
        (20, 14, N'shipping',   N'momo',    N'paid',   30000,    356000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000013","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội"}',
          N'BOOK30', 33000, '2026-05-28T08:15:00'),

        -- June 2026: mostly pending/confirmed
        (21, 15, N'confirmed',  N'cod',     N'unpaid', 30000,    4320000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000014","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng"}',
          NULL, 0, '2026-06-01T11:30:00'),
        (22, 16, N'pending',    N'vnpay', N'unpaid', 30000,    819000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000015","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-06-03T09:45:00'),
        (23, 3,  N'pending',    N'cod',     N'unpaid', 30000,    579000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-06-05T16:00:00'),
        (24, 2,  N'pending',    N'momo',    N'unpaid', 30000,    820000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0, '2026-06-06T13:20:00'),
        (25, 4,  N'pending',    N'cod',     N'unpaid', 30000,    268000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng"}',
          NULL, 0, '2026-06-07T10:00:00');
      SET IDENTITY_INSERT orders OFF;
    `);
    console.log('  + orders: 25 rows');

    // 39 order items with shop_id/shop_name snapshots
    await qr.query(`
      SET IDENTITY_INSERT order_items ON;
      INSERT INTO order_items (id, order_id, product_variant_id, shop_id, shop_name, product_name, sku, price, quantity, thumbnail_url, variant_option1_label, variant_option1_value, variant_option2_label, variant_option2_value) VALUES
        -- Order 1: user 2, shop 1 + shop 7
        (1,  1,  1,  1, N'Shop Thời Trang Hằng', N'Áo thun nam basic cotton', N'ATB-DEN-M',      199000, 2,
          N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Đen',            N'Kích thước', N'M'),
        (2,  1,  26, 7, N'Sơn Sneakers',          N'Dép quai ngang nam',       N'DQN-41',          250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', N'41',             NULL,          NULL),

        -- Order 2: user 3, shop 2
        (3,  2,  28, 2, N'TechZone VN',           N'iPhone 15 Pro Max',        N'IP15PM-256-TT',   32990000, 1,
          N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'256GB',          N'Màu',        N'Titan tự nhiên'),

        -- Order 3: user 4, shop 4 (3 books)
        (4,  3,  44, 4, N'Bảo Books',             N'Đắc Nhân Tâm',            N'DNT-01',           69000, 1,
          N'https://picsum.photos/seed/dac-nhan-tam/400/400',     NULL,          NULL,              NULL,          NULL),
        (5,  3,  45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 1,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL),
        (6,  3,  46, 4, N'Bảo Books',             N'Nhà Giả Kim',             N'NGK-01',           55000, 1,
          N'https://picsum.photos/seed/nha-gia-kim/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 4: user 5, shop 5 (cancelled)
        (7,  4,  14, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-XANH-30',     479000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Xanh đậm',      N'Kích thước', N'30'),

        -- Order 5: user 2, shop 6
        (8,  5,  36, 6, N'Lan Accessories',        N'Tai nghe AirPods Pro 2',   N'APP2-USBC',       5490000, 1,
          N'https://picsum.photos/seed/airpods-pro-2/400/400',    NULL,          NULL,              NULL,          NULL),
        (9,  5,  37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 6: user 14, shop 1 + shop 7 (with WELCOME10 coupon)
        (10, 6,  6,  1, N'Shop Thời Trang Hằng', N'Áo thun nam oversize',     N'ATO-DEN-L',       249000, 1,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Đen',            N'Kích thước', N'L'),
        (11, 6,  21, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-40',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'40',             NULL,          NULL),

        -- Order 7: user 15, shop 2
        (12, 7,  31, 2, N'TechZone VN',           N'Samsung Galaxy S24 Ultra', N'SS24U-256-DEN',   29990000, 1,
          N'https://picsum.photos/seed/samsung-s24/400/400',      N'Dung lượng', N'256GB',          N'Màu',        N'Đen'),

        -- Order 8: user 16, shop 3
        (13, 8,  40, 3, N'Mai''s Home & Living',  N'Ghế công thái học',        N'GCT-DEN',         4290000, 1,
          N'https://picsum.photos/seed/ghe-ergonomic/400/400',    N'Màu sắc',    N'Đen',            NULL,          NULL),

        -- Order 9: user 3, shop 7
        (14, 9,  22, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-41',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'41',             NULL,          NULL),
        (15, 9,  25, 7, N'Sơn Sneakers',          N'Dép quai ngang nam',       N'DQN-40',          250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', N'40',             NULL,          NULL),

        -- Order 10: user 4, shop 2
        (16, 10, 33, 2, N'TechZone VN',           N'MacBook Air M3',           N'MBA-M3-256-BH',   26490000, 1,
          N'https://picsum.photos/seed/macbook-air-m3/400/400',   N'Dung lượng', N'256GB',          N'Màu',        N'Bạc'),

        -- Order 11: user 5, shop 1 (cancelled)
        (17, 11, 10, 1, N'Shop Thời Trang Hằng', N'Áo sơ mi nam Oxford',      N'ASM-TRANG-M',     389000, 1,
          N'https://picsum.photos/seed/ao-so-mi-oxford/400/400',  N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),
        (18, 11, 4,  1, N'Shop Thời Trang Hằng', N'Áo thun nam basic cotton', N'ATB-TRANG-M',     250000, 1,
          N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),

        -- Order 12: user 2, shop 3 (with FREESHIP coupon)
        (19, 12, 42, 3, N'Mai''s Home & Living',  N'Nồi chiên không dầu 5L',  N'AF-5L',           1590000, 1,
          N'https://picsum.photos/seed/air-fryer/400/400',        NULL,          NULL,              NULL,          NULL),
        (20, 12, 43, 3, N'Mai''s Home & Living',  N'Bộ dao nhà bếp 6 món',    N'BD-6MON',         749000, 1,
          N'https://picsum.photos/seed/bo-dao/400/400',           NULL,          NULL,              NULL,          NULL),

        -- Order 13: user 14, shop 4
        (21, 13, 44, 4, N'Bảo Books',             N'Đắc Nhân Tâm',            N'DNT-01',           69000, 2,
          N'https://picsum.photos/seed/dac-nhan-tam/400/400',     NULL,          NULL,              NULL,          NULL),
        (22, 13, 45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 1,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL),

        -- Order 14: user 15, shop 5 + shop 6 (with FASHION20 coupon)
        (23, 14, 14, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-XANH-30',     479000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Xanh đậm',      N'Kích thước', N'30'),
        (24, 14, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 15: user 16, shop 2
        (25, 15, 35, 2, N'TechZone VN',           N'Lenovo ThinkPad X1 Carbon', N'TP-X1-C12',      33490000, 1,
          N'https://picsum.photos/seed/thinkpad-x1/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 16: user 3, shop 1 + shop 5 (shipping)
        (26, 16, 10, 1, N'Shop Thời Trang Hằng', N'Áo sơ mi nam Oxford',      N'ASM-TRANG-M',     389000, 1,
          N'https://picsum.photos/seed/ao-so-mi-oxford/400/400',  N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),
        (27, 16, 17, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-DEN-32',      550000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Đen',            N'Kích thước', N'32'),

        -- Order 17: user 4, shop 7 + shop 6
        (28, 17, 22, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-41',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'41',             NULL,          NULL),
        (29, 17, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 18: user 2, shop 3 (shipping)
        (30, 18, 42, 3, N'Mai''s Home & Living',  N'Nồi chiên không dầu 5L',  N'AF-5L',           1590000, 1,
          N'https://picsum.photos/seed/air-fryer/400/400',        NULL,          NULL,              NULL,          NULL),

        -- Order 19: user 5, shop 2 (confirmed)
        (31, 19, 29, 2, N'TechZone VN',           N'iPhone 15 Pro Max',        N'IP15PM-256-XD',   32990000, 1,
          N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'256GB',          N'Màu',        N'Xanh dương'),

        -- Order 20: user 14, shop 4 + shop 1 (with BOOK30 coupon, shipping)
        (32, 20, 46, 4, N'Bảo Books',             N'Nhà Giả Kim',             N'NGK-01',           55000, 2,
          N'https://picsum.photos/seed/nha-gia-kim/400/400',      NULL,          NULL,              NULL,          NULL),
        (33, 20, 6,  1, N'Shop Thời Trang Hằng', N'Áo thun nam oversize',     N'ATO-DEN-L',       249000, 1,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Đen',            N'Kích thước', N'L'),

        -- Order 21: user 15, shop 3 (confirmed)
        (34, 21, 40, 3, N'Mai''s Home & Living',  N'Ghế công thái học',        N'GCT-DEN',         4290000, 1,
          N'https://picsum.photos/seed/ghe-ergonomic/400/400',    N'Màu sắc',    N'Đen',            NULL,          NULL),

        -- Order 22: user 16, shop 5 (pending)
        (35, 22, 18, 5, N'Hùng Style',            N'Quần kaki nam',            N'QKK-BE-30',       420000, 1,
          N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Be',             N'Kích thước', N'30'),
        (36, 22, 20, 5, N'Hùng Style',            N'Quần kaki nam',            N'QKK-DEN-30',      369000, 1,
          N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Đen',            N'Kích thước', N'30'),

        -- Order 23: user 3, shop 6 (pending)
        (37, 23, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 24: user 2, shop 7 (pending)
        (38, 24, 23, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-42',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'42',             NULL,          NULL),

        -- Order 25: user 4, shop 4 (pending)
        (39, 25, 45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 2,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL);
      SET IDENTITY_INSERT order_items OFF;
    `);
    console.log('  + order_items: 39 rows');

    await qr.release();
  },
};
