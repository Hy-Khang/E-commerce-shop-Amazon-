import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const OrderSeed: ISeed = {
  name: 'order',
  order: 4,
  tables: ['order_items', 'orders'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // 37 orders: all have order_group_id (no legacy NULL values)
    // - Orders 1-31: converted from single/multi-shop checkouts (Mar–Jun 2026)
    // - Orders 32-37: multi-shop group checkouts (Jul 2026)
    await qr.query(`
      SET IDENTITY_INSERT orders ON;
      INSERT INTO orders (id, user_id, shop_id, shop_name, order_group_id, status, payment_method, payment_status, shipping_fee, total_amount, shipping_address, coupon_code, discount_amount, created_at) VALUES

        -- ===== MARCH 2026 =====

        -- Group D (orders 1-2): User 2 checkout, 2 shops, COD paid delivered
        (1,  2,  1, N'Shop Thời Trang Hằng',
          N'bb000001-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 428000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-03-05T09:15:00'),
        (2,  2,  7, N'Sơn Sneakers',
          N'bb000001-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 280000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-03-05T09:15:00'),

        -- Single-shop checkout
        (3,  3,  2, N'TechZone VN',
          N'aa000001-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 0, 32990000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh","latitude":10.7548,"longitude":106.6632}',
          NULL, 0, '2026-03-08T14:30:00'),

        (4,  4,  4, N'Bảo Books',
          N'aa000002-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 273000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-03-12T10:45:00'),

        (5,  5,  5, N'Hùng Style',
          N'aa000003-0000-0000-0000-000000000000',
          N'cancelled', N'vnpay', N'unpaid', 30000, 509000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội","latitude":21.0245,"longitude":105.8568}',
          NULL, 0, '2026-03-15T16:20:00'),

        (6,  2,  6, N'Lan Accessories',
          N'aa000004-0000-0000-0000-000000000000',
          N'delivered', N'momo', N'paid', 0, 6039000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-03-20T11:00:00'),

        -- Group E (orders 7-8): User 6 checkout, 2 shops, COD paid delivered, WELCOME10
        (7,  6,  1, N'Shop Thời Trang Hằng',
          N'bb000002-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 255000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000005","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội","latitude":21.0115,"longitude":105.8505}',
          N'WELCOME10', 24000, '2026-03-25T08:30:00'),
        (8,  6,  7, N'Sơn Sneakers',
          N'bb000002-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 744000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000005","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội","latitude":21.0115,"longitude":105.8505}',
          N'WELCOME10', 76000, '2026-03-25T08:30:00'),

        (9,  7,  2, N'TechZone VN',
          N'aa000005-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 0, 29990000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          NULL, 0, '2026-03-30T15:45:00'),

        -- ===== APRIL 2026 =====

        (10, 8,  3, N'Mai''s Home & Living',
          N'aa000006-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 4320000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000007","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh","latitude":10.7540,"longitude":106.6614}',
          NULL, 0, '2026-04-03T13:10:00'),

        (11, 3,  7, N'Sơn Sneakers',
          N'aa000007-0000-0000-0000-000000000000',
          N'delivered', N'momo', N'paid', 30000, 1070000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh","latitude":10.7548,"longitude":106.6632}',
          NULL, 0, '2026-04-08T09:30:00'),

        (12, 4,  2, N'TechZone VN',
          N'aa000008-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 0, 26490000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-04-12T17:00:00'),

        (13, 5,  1, N'Shop Thời Trang Hằng',
          N'aa000009-0000-0000-0000-000000000000',
          N'cancelled', N'cod', N'unpaid', 30000, 669000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội","latitude":21.0245,"longitude":105.8568}',
          NULL, 0, '2026-04-18T10:15:00'),

        (14, 2,  3, N'Mai''s Home & Living',
          N'aa000010-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 30000, 2339000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"456 Nguyễn Huệ, Quận 1","city":"Hồ Chí Minh","latitude":10.7741,"longitude":106.7011}',
          N'FREESHIP', 30000, '2026-04-22T14:20:00'),

        (15, 6,  4, N'Bảo Books',
          N'aa000011-0000-0000-0000-000000000000',
          N'delivered', N'cod', N'paid', 30000, 287000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000005","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội","latitude":21.0115,"longitude":105.8505}',
          NULL, 0, '2026-04-28T11:45:00'),

        -- ===== MAY 2026 =====

        -- Group F (orders 16-17): User 7 checkout, 2 shops, MoMo paid delivered, FASHION20
        (16, 7,  5, N'Hùng Style',
          N'bb000003-0000-0000-0000-000000000000',
          N'delivered', N'momo', N'paid', 30000, 464400,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          N'FASHION20', 44600, '2026-05-02T16:30:00'),
        (17, 7,  6, N'Lan Accessories',
          N'bb000003-0000-0000-0000-000000000000',
          N'delivered', N'momo', N'paid', 30000, 527800,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          N'FASHION20', 51200, '2026-05-02T16:30:00'),

        (18, 8,  2, N'TechZone VN',
          N'aa000012-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 0, 33490000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000007","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh","latitude":10.7540,"longitude":106.6614}',
          NULL, 0, '2026-05-07T09:00:00'),

        -- Group G (orders 19-20): User 3 checkout, 2 shops, COD shipping
        (19, 3,  1, N'Shop Thời Trang Hằng',
          N'bb000004-0000-0000-0000-000000000000',
          N'shipping', N'cod', N'unpaid', 30000, 419000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh","latitude":10.7548,"longitude":106.6632}',
          NULL, 0, '2026-05-12T12:30:00'),
        (20, 3,  5, N'Hùng Style',
          N'bb000004-0000-0000-0000-000000000000',
          N'shipping', N'cod', N'unpaid', 30000, 580000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh","latitude":10.7548,"longitude":106.6632}',
          NULL, 0, '2026-05-12T12:30:00'),

        -- Group H (orders 21-22): User 4 checkout, 2 shops, VNPay paid delivered
        (21, 4,  7, N'Sơn Sneakers',
          N'bb000005-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 30000, 820000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-05-15T14:00:00'),
        (22, 4,  6, N'Lan Accessories',
          N'bb000005-0000-0000-0000-000000000000',
          N'delivered', N'vnpay', N'paid', 30000, 579000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-05-15T14:00:00'),

        (23, 2,  3, N'Mai''s Home & Living',
          N'aa000013-0000-0000-0000-000000000000',
          N'shipping', N'cod', N'unpaid', 30000, 1620000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-05-20T10:45:00'),

        (24, 5,  2, N'TechZone VN',
          N'aa000014-0000-0000-0000-000000000000',
          N'confirmed', N'vnpay', N'paid', 0, 32990000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội","latitude":21.0245,"longitude":105.8568}',
          NULL, 0, '2026-05-25T15:20:00'),

        -- Group I (orders 25-26): User 6 checkout, 2 shops, MoMo paid shipping, BOOK30
        (25, 6,  4, N'Bảo Books',
          N'bb000006-0000-0000-0000-000000000000',
          N'shipping', N'momo', N'paid', 30000, 107000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000005","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội","latitude":21.0115,"longitude":105.8505}',
          N'BOOK30', 33000, '2026-05-28T08:15:00'),
        (26, 6,  1, N'Shop Thời Trang Hằng',
          N'bb000006-0000-0000-0000-000000000000',
          N'shipping', N'momo', N'paid', 30000, 279000,
          N'{"full_name":"Hoàng Thị Nga","phone":"0901000005","address_line":"56 Bà Triệu, Hai Bà Trưng","city":"Hà Nội","latitude":21.0115,"longitude":105.8505}',
          NULL, 0, '2026-05-28T08:15:00'),

        -- ===== JUNE 2026 =====

        (27, 7,  3, N'Mai''s Home & Living',
          N'aa000015-0000-0000-0000-000000000000',
          N'confirmed', N'cod', N'unpaid', 30000, 4320000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          NULL, 0, '2026-06-01T11:30:00'),

        (28, 8,  5, N'Hùng Style',
          N'aa000016-0000-0000-0000-000000000000',
          N'pending', N'vnpay', N'unpaid', 30000, 819000,
          N'{"full_name":"Bùi Minh Tâm","phone":"0901000007","address_line":"90 Nguyễn Trãi, Quận 5","city":"Hồ Chí Minh","latitude":10.7540,"longitude":106.6614}',
          NULL, 0, '2026-06-03T09:45:00'),

        (29, 3,  6, N'Lan Accessories',
          N'aa000017-0000-0000-0000-000000000000',
          N'pending', N'cod', N'unpaid', 30000, 579000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh","latitude":10.7548,"longitude":106.6632}',
          NULL, 0, '2026-06-05T16:00:00'),

        (30, 2,  7, N'Sơn Sneakers',
          N'aa000018-0000-0000-0000-000000000000',
          N'pending', N'momo', N'unpaid', 30000, 820000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-06-06T13:20:00'),

        (31, 4,  4, N'Bảo Books',
          N'aa000019-0000-0000-0000-000000000000',
          N'pending', N'cod', N'unpaid', 30000, 268000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-06-07T10:00:00'),

        -- ===== JULY 2026: MULTI-SHOP GROUP ORDERS =====

        -- Group A: User 2, VNPay, 3 shops (all paid — group payment)
        (32, 2,  1, N'Shop Thời Trang Hằng',
          N'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          N'confirmed', N'vnpay', N'paid', 30000, 727000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-07-10T10:00:00'),
        (33, 2,  2, N'TechZone VN',
          N'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          N'shipping', N'vnpay', N'paid', 0, 29990000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-07-10T10:00:00'),
        (34, 2,  7, N'Sơn Sneakers',
          N'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          N'pending', N'vnpay', N'paid', 30000, 1070000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh","latitude":10.7726,"longitude":106.6981}',
          NULL, 0, '2026-07-10T10:00:00'),

        -- Group B: User 4, MoMo, 1 shop (payment not completed yet)
        (35, 4,  6, N'Lan Accessories',
          N'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          N'pending', N'momo', N'unpaid', 0, 5490000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng","latitude":16.0678,"longitude":108.2208}',
          NULL, 0, '2026-07-12T14:30:00'),

        -- Group C: User 7, COD, 2 shops (one confirmed, one cancelled)
        (36, 7,  3, N'Mai''s Home & Living',
          N'c3d4e5f6-a7b8-9012-cdef-123456789012',
          N'confirmed', N'cod', N'unpaid', 30000, 1620000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          NULL, 0, '2026-07-15T09:00:00'),
        (37, 7,  5, N'Hùng Style',
          N'c3d4e5f6-a7b8-9012-cdef-123456789012',
          N'cancelled', N'cod', N'unpaid', 30000, 450000,
          N'{"full_name":"Đỗ Văn Khoa","phone":"0901000006","address_line":"78 Hùng Vương, Thanh Khê","city":"Đà Nẵng","latitude":16.0680,"longitude":108.2060}',
          NULL, 0, '2026-07-15T09:00:00');
      SET IDENTITY_INSERT orders OFF;
    `);
    console.log('  + orders: 37 rows (all with order_group_id, no legacy NULL)');

    // 47 order items with shop_id/shop_name snapshots
    await qr.query(`
      SET IDENTITY_INSERT order_items ON;
      INSERT INTO order_items (id, order_id, product_variant_id, shop_id, shop_name, product_name, sku, price, quantity, thumbnail_url, variant_option1_label, variant_option1_value, variant_option2_label, variant_option2_value) VALUES
        -- Order 1 (Group D, shop 1): Áo thun basic x2
        (1,  1,  1,  1, N'Shop Thời Trang Hằng', N'Áo thun nam basic cotton', N'ATB-DEN-M',      199000, 2,
          N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Đen',            N'Kích thước', N'M'),

        -- Order 2 (Group D, shop 7): Dép quai ngang x1
        (2,  2,  26, 7, N'Sơn Sneakers',          N'Dép quai ngang nam',       N'DQN-41',          250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', N'41',             NULL,          NULL),

        -- Order 3: iPhone 15 Pro Max
        (3,  3,  28, 2, N'TechZone VN',           N'iPhone 15 Pro Max',        N'IP15PM-256-TT',   32990000, 1,
          N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'256GB',          N'Màu',        N'Titan tự nhiên'),

        -- Order 4: 3 books
        (4,  4,  44, 4, N'Bảo Books',             N'Đắc Nhân Tâm',            N'DNT-01',           69000, 1,
          N'https://picsum.photos/seed/dac-nhan-tam/400/400',     NULL,          NULL,              NULL,          NULL),
        (5,  4,  45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 1,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL),
        (6,  4,  46, 4, N'Bảo Books',             N'Nhà Giả Kim',             N'NGK-01',           55000, 1,
          N'https://picsum.photos/seed/nha-gia-kim/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 5: Quần jean (cancelled)
        (7,  5,  14, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-XANH-30',     479000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Xanh đậm',      N'Kích thước', N'30'),

        -- Order 6: AirPods + Sạc
        (8,  6,  36, 6, N'Lan Accessories',        N'Tai nghe AirPods Pro 2',   N'APP2-USBC',       5490000, 1,
          N'https://picsum.photos/seed/airpods-pro-2/400/400',    NULL,          NULL,              NULL,          NULL),
        (9,  6,  37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 7 (Group E, shop 1): Áo oversize x1
        (10, 7,  6,  1, N'Shop Thời Trang Hằng', N'Áo thun nam oversize',     N'ATO-DEN-L',       249000, 1,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Đen',            N'Kích thước', N'L'),

        -- Order 8 (Group E, shop 7): Sneaker x1
        (11, 8,  21, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-40',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'40',             NULL,          NULL),

        -- Order 9: Samsung Galaxy S24 Ultra
        (12, 9,  31, 2, N'TechZone VN',           N'Samsung Galaxy S24 Ultra', N'SS24U-256-DEN',   29990000, 1,
          N'https://picsum.photos/seed/samsung-s24/400/400',      N'Dung lượng', N'256GB',          N'Màu',        N'Đen'),

        -- Order 10: Ghế công thái học
        (13, 10, 40, 3, N'Mai''s Home & Living',  N'Ghế công thái học',        N'GCT-DEN',         4290000, 1,
          N'https://picsum.photos/seed/ghe-ergonomic/400/400',    N'Màu sắc',    N'Đen',            NULL,          NULL),

        -- Order 11: Sneaker + Dép
        (14, 11, 22, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-41',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'41',             NULL,          NULL),
        (15, 11, 25, 7, N'Sơn Sneakers',          N'Dép quai ngang nam',       N'DQN-40',          250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', N'40',             NULL,          NULL),

        -- Order 12: MacBook Air M3
        (16, 12, 33, 2, N'TechZone VN',           N'MacBook Air M3',           N'MBA-M3-256-BH',   26490000, 1,
          N'https://picsum.photos/seed/macbook-air-m3/400/400',   N'Dung lượng', N'256GB',          N'Màu',        N'Bạc'),

        -- Order 13: Áo sơ mi + Áo thun (cancelled)
        (17, 13, 10, 1, N'Shop Thời Trang Hằng', N'Áo sơ mi nam Oxford',      N'ASM-TRANG-M',     389000, 1,
          N'https://picsum.photos/seed/ao-so-mi-oxford/400/400',  N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),
        (18, 13, 4,  1, N'Shop Thời Trang Hằng', N'Áo thun nam basic cotton', N'ATB-TRANG-M',     250000, 1,
          N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),

        -- Order 14: Nồi chiên + Bộ dao (FREESHIP)
        (19, 14, 42, 3, N'Mai''s Home & Living',  N'Nồi chiên không dầu 5L',  N'AF-5L',           1590000, 1,
          N'https://picsum.photos/seed/air-fryer/400/400',        NULL,          NULL,              NULL,          NULL),
        (20, 14, 43, 3, N'Mai''s Home & Living',  N'Bộ dao nhà bếp 6 món',    N'BD-6MON',         749000, 1,
          N'https://picsum.photos/seed/bo-dao/400/400',           NULL,          NULL,              NULL,          NULL),

        -- Order 15: 2 books
        (21, 15, 44, 4, N'Bảo Books',             N'Đắc Nhân Tâm',            N'DNT-01',           69000, 2,
          N'https://picsum.photos/seed/dac-nhan-tam/400/400',     NULL,          NULL,              NULL,          NULL),
        (22, 15, 45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 1,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL),

        -- Order 16 (Group F, shop 5): Jean x1
        (23, 16, 14, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-XANH-30',     479000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Xanh đậm',      N'Kích thước', N'30'),

        -- Order 17 (Group F, shop 6): Sạc x1
        (24, 17, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 18: ThinkPad
        (25, 18, 35, 2, N'TechZone VN',           N'Lenovo ThinkPad X1 Carbon', N'TP-X1-C12',      33490000, 1,
          N'https://picsum.photos/seed/thinkpad-x1/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 19 (Group G, shop 1): Oxford x1
        (26, 19, 10, 1, N'Shop Thời Trang Hằng', N'Áo sơ mi nam Oxford',      N'ASM-TRANG-M',     389000, 1,
          N'https://picsum.photos/seed/ao-so-mi-oxford/400/400',  N'Màu sắc',    N'Trắng',          N'Kích thước', N'M'),

        -- Order 20 (Group G, shop 5): Jean đen x1
        (27, 20, 17, 5, N'Hùng Style',            N'Quần jean nam slim fit',   N'QJS-DEN-32',      550000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Đen',            N'Kích thước', N'32'),

        -- Order 21 (Group H, shop 7): Sneaker x1
        (28, 21, 22, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-41',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'41',             NULL,          NULL),

        -- Order 22 (Group H, shop 6): Sạc x1
        (29, 22, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 23: Nồi chiên
        (30, 23, 42, 3, N'Mai''s Home & Living',  N'Nồi chiên không dầu 5L',  N'AF-5L',           1590000, 1,
          N'https://picsum.photos/seed/air-fryer/400/400',        NULL,          NULL,              NULL,          NULL),

        -- Order 24: iPhone (confirmed)
        (31, 24, 29, 2, N'TechZone VN',           N'iPhone 15 Pro Max',        N'IP15PM-256-XD',   32990000, 1,
          N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'256GB',          N'Màu',        N'Xanh dương'),

        -- Order 25 (Group I, shop 4): Nhà Giả Kim x2 (BOOK30)
        (32, 25, 46, 4, N'Bảo Books',             N'Nhà Giả Kim',             N'NGK-01',           55000, 2,
          N'https://picsum.photos/seed/nha-gia-kim/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 26 (Group I, shop 1): Oversize x1
        (33, 26, 6,  1, N'Shop Thời Trang Hằng', N'Áo thun nam oversize',     N'ATO-DEN-L',       249000, 1,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Đen',            N'Kích thước', N'L'),

        -- Order 27: Ghế (confirmed)
        (34, 27, 40, 3, N'Mai''s Home & Living',  N'Ghế công thái học',        N'GCT-DEN',         4290000, 1,
          N'https://picsum.photos/seed/ghe-ergonomic/400/400',    N'Màu sắc',    N'Đen',            NULL,          NULL),

        -- Order 28: 2 quần kaki (pending)
        (35, 28, 18, 5, N'Hùng Style',            N'Quần kaki nam',            N'QKK-BE-30',       420000, 1,
          N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Be',             N'Kích thước', N'30'),
        (36, 28, 20, 5, N'Hùng Style',            N'Quần kaki nam',            N'QKK-DEN-30',      369000, 1,
          N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Đen',            N'Kích thước', N'30'),

        -- Order 29: Sạc (pending)
        (37, 29, 37, 6, N'Lan Accessories',        N'Sạc nhanh 65W GaN',       N'SN65W-GAN',       549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,              NULL,          NULL),

        -- Order 30: Sneaker (pending)
        (38, 30, 23, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-42',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'42',             NULL,          NULL),

        -- Order 31: 2 Atomic Habits (pending)
        (39, 31, 45, 4, N'Bảo Books',             N'Atomic Habits',            N'AH-01',            119000, 2,
          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,              NULL,          NULL),

        -- ===== ITEMS FOR MULTI-SHOP GROUP ORDERS (Jul 2026) =====

        -- Order 32 (Group A, shop 1): Áo thun basic x1 + Áo thun oversize x2
        (40, 32, 1,  1, N'Shop Thời Trang Hằng', N'Áo thun nam basic cotton', N'ATB-DEN-M',      199000, 1,
          N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Đen',            N'Kích thước', N'M'),
        (41, 32, 6,  1, N'Shop Thời Trang Hằng', N'Áo thun nam oversize',     N'ATO-DEN-L',       249000, 2,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Đen',            N'Kích thước', N'L'),

        -- Order 33 (Group A, shop 2): Samsung Galaxy S24 Ultra x1
        (42, 33, 31, 2, N'TechZone VN',           N'Samsung Galaxy S24 Ultra', N'SS24U-256-DEN',   29990000, 1,
          N'https://picsum.photos/seed/samsung-s24/400/400',      N'Dung lượng', N'256GB',          N'Màu',        N'Đen'),

        -- Order 34 (Group A, shop 7): Giày sneaker x1 + Dép quai ngang x1
        (43, 34, 22, 7, N'Sơn Sneakers',          N'Giày sneaker trắng',       N'GST-41',          790000, 1,
          N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', N'41',             NULL,          NULL),
        (44, 34, 25, 7, N'Sơn Sneakers',          N'Dép quai ngang nam',       N'DQN-40',          250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', N'40',             NULL,          NULL),

        -- Order 35 (Group B, shop 6): AirPods Pro 2 x1
        (45, 35, 36, 6, N'Lan Accessories',        N'Tai nghe AirPods Pro 2',   N'APP2-USBC',       5490000, 1,
          N'https://picsum.photos/seed/airpods-pro-2/400/400',    NULL,          NULL,              NULL,          NULL),

        -- Order 36 (Group C, shop 3): Nồi chiên không dầu x1
        (46, 36, 42, 3, N'Mai''s Home & Living',  N'Nồi chiên không dầu 5L',  N'AF-5L',           1590000, 1,
          N'https://picsum.photos/seed/air-fryer/400/400',        NULL,          NULL,              NULL,          NULL),

        -- Order 37 (Group C, shop 5): Quần kaki x1 (cancelled)
        (47, 37, 18, 5, N'Hùng Style',            N'Quần kaki nam',            N'QKK-BE-30',       420000, 1,
          N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Be',             N'Kích thước', N'30');
      SET IDENTITY_INSERT order_items OFF;
    `);
    console.log('  + order_items: 47 rows');

    // Assign shipper (user_id=16) to delivered & shipping orders + set delivered_at
    await qr.query(`
      UPDATE orders SET shipper_id = 16, delivered_at = DATEADD(DAY, 2, created_at)
      WHERE id IN (1,2,3,4,6,7,8,9,10,11,12,14,15,16,17,18,21,22);

      UPDATE orders SET shipper_id = 16
      WHERE id IN (19,20,23,25,26,33);
    `);
    console.log('  + shipper assignments: 24 orders (18 delivered + 6 shipping)');

    await qr.release();
  },
};
