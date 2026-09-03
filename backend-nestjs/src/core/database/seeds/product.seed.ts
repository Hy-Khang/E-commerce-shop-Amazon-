import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const ProductSeed: ISeed = {
  name: 'product',
  order: 3,
  tables: ['product_images', 'product_variants', 'products', 'categories'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // ── Categories (4 root + 8 sub + 4 sub-sub = 16) ──
    await qr.query(`
      SET IDENTITY_INSERT categories ON;
      INSERT INTO categories (id, parent_id, name, slug) VALUES
        (1,  NULL, N'Thời trang',          N'thoi-trang'),
        (2,  NULL, N'Điện tử',             N'dien-tu'),
        (3,  NULL, N'Nhà cửa & Đời sống', N'nha-cua-doi-song'),
        (4,  NULL, N'Sách',                N'sach'),
        (5,  1, N'Áo nam',                N'ao-nam'),
        (6,  1, N'Quần nam',              N'quan-nam'),
        (7,  1, N'Giày dép',              N'giay-dep'),
        (8,  2, N'Điện thoại',            N'dien-thoai'),
        (9,  2, N'Laptop',                N'laptop'),
        (10, 2, N'Phụ kiện',              N'phu-kien'),
        (11, 3, N'Nội thất',              N'noi-that'),
        (12, 3, N'Đồ dùng nhà bếp',      N'do-dung-nha-bep'),
        (13, 4, N'Sách kỹ năng',          N'sach-ky-nang'),
        (14, 4, N'Sách văn học',           N'sach-van-hoc'),
        (15, 5, N'Áo thun',               N'ao-thun'),
        (16, 5, N'Áo sơ mi',              N'ao-so-mi');
      SET IDENTITY_INSERT categories OFF;
    `);
    console.log('  + categories: 16 rows');

    // ── Products (20) — distributed across 7 shops ──
    // Shop 1: fashion tops (1-3), Shop 2: electronics (8-11), Shop 3: home (14-17)
    // Shop 4: books (18-20), Shop 5: fashion bottoms (4-5), Shop 6: accessories (12-13), Shop 7: shoes (6-7)
    await qr.query(`
      SET IDENTITY_INSERT products ON;
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (1,  15, 1, N'Áo thun nam basic cotton',       N'ao-thun-nam-basic-cotton',       N'Áo thun nam chất liệu cotton 100%, thoáng mát',           N'/uploads/products/seed/p1.jpg',    N'Màu sắc',    N'Kích thước', 1),
        (2,  15, 1, N'Áo thun nam oversize',            N'ao-thun-nam-oversize',            N'Áo thun form rộng phong cách Hàn Quốc',                    N'/uploads/products/seed/p2.jpg', N'Màu sắc',    N'Kích thước', 1),
        (3,  16, 1, N'Áo sơ mi nam Oxford',             N'ao-so-mi-nam-oxford',             N'Áo sơ mi Oxford dáng slim fit, vải dày dặn',               N'/uploads/products/seed/p3.jpg',  N'Màu sắc',    N'Kích thước', 1),
        (4,  6,  5, N'Quần jean nam slim fit',          N'quan-jean-nam-slim-fit',          N'Quần jean co giãn, dáng ôm vừa phải',                      N'/uploads/products/seed/p4.jpg',   N'Màu sắc',    N'Kích thước', 1),
        (5,  6,  5, N'Quần kaki nam',                   N'quan-kaki-nam',                   N'Quần kaki nam form regular, vải mềm',                       N'/uploads/products/seed/p5.jpg',        N'Màu sắc',    N'Kích thước', 1),
        (6,  7,  7, N'Giày sneaker trắng',              N'giay-sneaker-trang',              N'Giày sneaker trắng basic, đế cao su bền',                   N'/uploads/products/seed/p6.jpg',    N'Kích thước', NULL,          1),
        (7,  7,  7, N'Dép quai ngang nam',              N'dep-quai-ngang-nam',              N'Dép quai ngang êm chân, phù hợp đi hàng ngày',             N'/uploads/products/seed/p7.jpg',   N'Kích thước', NULL,          1),
        (8,  8,  2, N'iPhone 15 Pro Max',               N'iphone-15-pro-max',               N'iPhone 15 Pro Max chip A17 Pro, camera 48MP',                N'/uploads/products/seed/p8.jpg', N'Dung lượng', N'Màu',        1),
        (9,  8,  2, N'Samsung Galaxy S24 Ultra',        N'samsung-galaxy-s24-ultra',        N'Samsung Galaxy S24 Ultra, S Pen tích hợp',                  N'/uploads/products/seed/p9.jpg',      N'Dung lượng', N'Màu',        1),
        (10, 9,  2, N'MacBook Air M3',                  N'macbook-air-m3',                  N'MacBook Air chip M3, 15.3 inch Liquid Retina',              N'/uploads/products/laptop/1711080787179-apple-02.png',   N'Dung lượng', N'Màu',        1),
        (11, 9,  2, N'Lenovo ThinkPad X1 Carbon',       N'lenovo-thinkpad-x1-carbon',       N'ThinkPad X1 Carbon Gen 12, Core Ultra 7',                   N'/uploads/products/laptop/1711079073759-lenovo-01.png',      NULL,          NULL,          1),
        (12, 10, 6, N'Tai nghe AirPods Pro 2',          N'tai-nghe-airpods-pro-2',          N'AirPods Pro 2 USB-C, chống ồn chủ động',                   N'/uploads/products/seed/p12.jpg',    NULL,          NULL,          1),
        (13, 10, 6, N'Sạc nhanh 65W GaN',              N'sac-nhanh-65w-gan',              N'Sạc nhanh 65W GaN, 3 cổng, gọn nhẹ',                       N'/uploads/products/seed/p13.jpg',      NULL,          NULL,          1),
        (14, 11, 3, N'Bàn làm việc gỗ tự nhiên',       N'ban-lam-viec-go-tu-nhien',       N'Bàn làm việc gỗ sồi, kích thước 120x60cm',                 N'/uploads/products/seed/p14.jpg',     N'Màu sắc',    NULL,          1),
        (15, 11, 3, N'Ghế công thái học',               N'ghe-cong-thai-hoc',               N'Ghế ergonomic có tựa đầu, tay vịn điều chỉnh',             N'/uploads/products/seed/p15.jpg',    N'Màu sắc',    NULL,          1),
        (16, 12, 3, N'Nồi chiên không dầu 5L',         N'noi-chien-khong-dau-5l',         N'Air fryer 5 lít, 8 chế độ nấu, màn hình cảm ứng',         N'/uploads/products/seed/p16.jpg',         NULL,          NULL,          1),
        (17, 12, 3, N'Bộ dao nhà bếp 6 món',           N'bo-dao-nha-bep-6-mon',           N'Bộ dao thép không gỉ kèm block gỗ',                        N'/uploads/products/seed/p17.jpg',            NULL,          NULL,          1),
        (18, 13, 4, N'Đắc Nhân Tâm',                   N'dac-nhan-tam',                   N'Dale Carnegie - Nghệ thuật ứng xử và giao tiếp',           N'/uploads/products/seed/p18.jpg',     NULL,          NULL,          1),
        (19, 13, 4, N'Atomic Habits',                   N'atomic-habits',                   N'James Clear - Thay đổi tí hon, hiệu quả bất ngờ',          N'/uploads/products/seed/p19.jpg',    NULL,          NULL,          1),
        (20, 14, 4, N'Nhà Giả Kim',                    N'nha-gia-kim',                    N'Paulo Coelho - Tiểu thuyết triết lý nổi tiếng thế giới',   N'/uploads/products/seed/p20.jpg',      NULL,          NULL,          1);
      SET IDENTITY_INSERT products OFF;
    `);
    console.log('  + products: 20 rows');

    // ── Product Variants (46) ──
    await qr.query(`
      SET IDENTITY_INSERT product_variants ON;
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        (1,  1, N'ATB-DEN-M',   N'Đen',   N'M',  250000, 199000, 50),
        (2,  1, N'ATB-DEN-L',   N'Đen',   N'L',  250000, 199000, 40),
        (3,  1, N'ATB-DEN-XL',  N'Đen',   N'XL', 250000, 199000, 30),
        (4,  1, N'ATB-TRANG-M', N'Trắng', N'M',  250000, NULL,   45),
        (5,  1, N'ATB-TRANG-L', N'Trắng', N'L',  250000, NULL,   35),
        (6,  2, N'ATO-DEN-L',   N'Đen',   N'L',  290000, 249000, 30),
        (7,  2, N'ATO-DEN-XL',  N'Đen',   N'XL', 290000, 249000, 25),
        (8,  2, N'ATO-XAM-L',   N'Xám',   N'L',  290000, NULL,   35),
        (9,  2, N'ATO-XAM-XL',  N'Xám',   N'XL', 290000, NULL,   20),
        (10, 3, N'ASM-TRANG-M', N'Trắng', N'M',  450000, 389000, 20),
        (11, 3, N'ASM-TRANG-L', N'Trắng', N'L',  450000, 389000, 15),
        (12, 3, N'ASM-XANH-M',  N'Xanh',  N'M',  450000, NULL,   25),
        (13, 3, N'ASM-XANH-L',  N'Xanh',  N'L',  450000, NULL,   20),
        (14, 4, N'QJS-XANH-30', N'Xanh đậm', N'30', 550000, 479000, 20),
        (15, 4, N'QJS-XANH-32', N'Xanh đậm', N'32', 550000, 479000, 25),
        (16, 4, N'QJS-DEN-30',  N'Đen',       N'30', 550000, NULL,   15),
        (17, 4, N'QJS-DEN-32',  N'Đen',       N'32', 550000, NULL,   20),
        (18, 5, N'QKK-BE-30',   N'Be',    N'30', 420000, NULL,   30),
        (19, 5, N'QKK-BE-32',   N'Be',    N'32', 420000, NULL,   25),
        (20, 5, N'QKK-DEN-30',  N'Đen',   N'30', 420000, 369000, 20),
        (21, 6, N'GST-40',      N'40',    NULL, 890000, 790000, 15),
        (22, 6, N'GST-41',      N'41',    NULL, 890000, 790000, 20),
        (23, 6, N'GST-42',      N'42',    NULL, 890000, 790000, 18),
        (24, 6, N'GST-43',      N'43',    NULL, 890000, 790000, 10),
        (25, 7, N'DQN-40',      N'40',    NULL, 250000, NULL,   40),
        (26, 7, N'DQN-41',      N'41',    NULL, 250000, NULL,   35),
        (27, 7, N'DQN-42',      N'42',    NULL, 250000, NULL,   30),
        (28, 8, N'IP15PM-256-TT',  N'256GB', N'Titan tự nhiên', 34990000, 32990000, 10),
        (29, 8, N'IP15PM-256-XD',  N'256GB', N'Xanh dương',     34990000, 32990000, 8),
        (30, 8, N'IP15PM-512-TT',  N'512GB', N'Titan tự nhiên', 40990000, NULL,      5),
        (31, 9, N'SS24U-256-DEN',  N'256GB', N'Đen',    31990000, 29990000, 12),
        (32, 9, N'SS24U-512-TIM',  N'512GB', N'Tím',    37990000, NULL,      6),
        (33, 10, N'MBA-M3-256-BH',  N'256GB', N'Bạc',       27990000, 26490000, 8),
        (34, 10, N'MBA-M3-512-XD',  N'512GB', N'Xanh đêm',  33990000, NULL,     5),
        (35, 11, N'TP-X1-C12',      NULL,     NULL, 35990000, 33490000, 4),
        (36, 12, N'APP2-USBC',      NULL,     NULL, 5990000,  5490000,  25),
        (37, 13, N'SN65W-GAN',      NULL,     NULL, 650000,   549000,   40),
        (38, 14, N'BLV-SOI',        N'Gỗ sồi',    NULL, 3500000, 2990000, 8),
        (39, 14, N'BLV-OC',         N'Gỗ óc chó', NULL, 4500000, NULL,    5),
        (40, 15, N'GCT-DEN',        N'Đen',   NULL, 4990000, 4290000, 6),
        (41, 15, N'GCT-XAM',        N'Xám',   NULL, 4990000, NULL,    8),
        (42, 16, N'AF-5L',          NULL,     NULL, 1890000, 1590000, 15),
        (43, 17, N'BD-6MON',        NULL,     NULL, 890000,  749000,  20),
        (44, 18, N'DNT-01',         NULL,     NULL, 86000,   69000,   100),
        (45, 19, N'AH-01',          NULL,     NULL, 150000,  119000,  80),
        (46, 20, N'NGK-01',         NULL,     NULL, 69000,   55000,   120);
      SET IDENTITY_INSERT product_variants OFF;
    `);
    console.log('  + product_variants: 46 rows');

    // ── Product Images (45) — includes variant-specific images for color products ──
    await qr.query(`
      SET IDENTITY_INSERT product_images ON;
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        -- Product 1: Áo thun basic — shared + Đen + Trắng
        (1,  1,  N'/uploads/products/seed/p1.jpg',       0, NULL),
        (2,  1,  N'/uploads/products/seed/p1.jpg',   0, N'Đen'),
        (3,  1,  N'/uploads/products/seed/p1.jpg',   1, N'Đen'),
        (4,  1,  N'/uploads/products/seed/p1.jpg', 0, N'Trắng'),
        (5,  1,  N'/uploads/products/seed/p1.jpg', 1, N'Trắng'),
        -- Product 2: Áo thun oversize — Đen + Xám (no shared, tests variant-only)
        (6,  2,  N'/uploads/products/seed/p2.jpg',     0, N'Đen'),
        (7,  2,  N'/uploads/products/seed/p2.jpg',     1, N'Đen'),
        (8,  2,  N'/uploads/products/seed/p2.jpg',     0, N'Xám'),
        (9,  2,  N'/uploads/products/seed/p2.jpg',     1, N'Xám'),
        -- Product 3: Áo sơ mi Oxford — shared + Trắng + Xanh
        (10, 3,  N'/uploads/products/seed/p3.jpg',       0, NULL),
        (11, 3,  N'/uploads/products/seed/p3.jpg',        0, N'Trắng'),
        (12, 3,  N'/uploads/products/seed/p3.jpg',         0, N'Xanh'),
        -- Product 4-5: Quần — shared only (tests fallback)
        (13, 4,  N'/uploads/products/seed/p4.jpg',  0, NULL),
        (14, 4,  N'/uploads/products/seed/p4.jpg',  1, NULL),
        (15, 5,  N'/uploads/products/seed/p5.jpg',       0, NULL),
        (16, 5,  N'/uploads/products/seed/p5.jpg',       1, NULL),
        -- Product 6-7: Giày dép — no color variants, all shared
        (17, 6,  N'/uploads/products/seed/p6.jpg',      0, NULL),
        (18, 6,  N'/uploads/products/seed/p6.jpg',      1, NULL),
        (19, 7,  N'/uploads/products/seed/p7.jpg',     0, NULL),
        (20, 7,  N'/uploads/products/seed/p7.jpg',     1, NULL),
        -- Product 8-13: Electronics — all shared
        (21, 8,  N'/uploads/products/seed/p8.jpg',   0, NULL),
        (22, 8,  N'/uploads/products/seed/p8.jpg',   1, NULL),
        (23, 9,  N'/uploads/products/seed/p9.jpg',        0, NULL),
        (24, 9,  N'/uploads/products/seed/p9.jpg',        1, NULL),
        (25, 10, N'/uploads/products/laptop/1711080787179-apple-02.png',     0, NULL),
        (26, 10, N'/uploads/products/laptop/1711080787179-apple-02.png',     1, NULL),
        (27, 11, N'/uploads/products/laptop/1711079073759-lenovo-01.png',        0, NULL),
        (28, 11, N'/uploads/products/laptop/1711079073759-lenovo-01.png',        1, NULL),
        (29, 12, N'/uploads/products/seed/p12.jpg',      0, NULL),
        (30, 12, N'/uploads/products/seed/p12.jpg',      1, NULL),
        (31, 13, N'/uploads/products/seed/p13.jpg',        0, NULL),
        -- Product 14: Bàn làm việc — Gỗ sồi + Gỗ óc chó
        (32, 14, N'/uploads/products/seed/p14.jpg',   0, N'Gỗ sồi'),
        (33, 14, N'/uploads/products/seed/p14.jpg',0, N'Gỗ óc chó'),
        -- Product 15: Ghế — Đen + Xám
        (34, 15, N'/uploads/products/seed/p15.jpg',  0, N'Đen'),
        (35, 15, N'/uploads/products/seed/p15.jpg',  0, N'Xám'),
        -- Product 16-20: No variants, all shared
        (36, 16, N'/uploads/products/seed/p16.jpg',          0, NULL),
        (37, 16, N'/uploads/products/seed/p16.jpg',          1, NULL),
        (38, 17, N'/uploads/products/seed/p17.jpg',             0, NULL),
        (39, 18, N'/uploads/products/seed/p18.jpg',       0, NULL),
        (40, 19, N'/uploads/products/seed/p19.jpg',      0, NULL),
        (41, 20, N'/uploads/products/seed/p20.jpg',        0, NULL);
      SET IDENTITY_INSERT product_images OFF;
    `);
    console.log('  + product_images: 41 rows');

    // ══════════════════════════════════════════════════════════════
    // ── NEW SEED DATA (based on uploaded product images) ──────────
    // ══════════════════════════════════════════════════════════════

    // ── New Categories (2) ──
    await qr.query(`
      SET IDENTITY_INSERT categories ON;
      INSERT INTO categories (id, parent_id, name, slug) VALUES
        (17, 5, N'Áo khoác',              N'ao-khoac'),
        (18, 1, N'Phụ kiện thời trang',   N'phu-kien-thoi-trang');
      SET IDENTITY_INSERT categories OFF;
    `);
    console.log('  + categories: +2 rows (17-18)');

    // ── New Products (30) ──
    await qr.query(`
      SET IDENTITY_INSERT products ON;
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (21, 17, 1, N'Áo khoác Non Branded 04',     N'ao-khoac-non-branded-04',     N'Áo khoác gió có nón, chất liệu nhẹ chống nước',
          N'/uploads/products/ao/ao-khoac-non-branded-04-den-1174884707.webp', N'Màu sắc', N'Kích thước', 1),
        (22, 17, 1, N'Áo khoác The Beginner M006',  N'ao-khoac-the-beginner-m006',  N'Áo khoác thể thao The Beginner, form slim fit, vải gió cao cấp',
          N'/uploads/products/ao/ao-khoac-the-beginner-m006-den-1177437004.webp', N'Màu sắc', N'Kích thước', 1),
        (23, 16, 1, N'Áo sơ mi Non Branded 19',     N'ao-so-mi-non-branded-19',     N'Áo sơ mi tay ngắn form regular, vải mềm thoáng mát',
          N'/uploads/products/ao/ao-so-mi-non-branded-19-tr-ng-1174884380.webp', N'Kích thước', NULL, 1),
        (24, 16, 1, N'Áo sơ mi Non Branded 33',     N'ao-so-mi-non-branded-33',     N'Áo sơ mi tay ngắn cổ bẻ, phong cách lịch lãm',
          N'/uploads/products/ao/ao-so-mi-non-branded-33-xanh-d-ng-1174884119.webp', N'Màu sắc', N'Kích thước', 1),
        (25, 16, 1, N'Áo sơ mi Seventy Seven 22',   N'ao-so-mi-seventy-seven-22',   N'Áo sơ mi phối tay contrast, chất liệu cotton pha',
          N'/uploads/products/ao/ao-so-mi-seventy-seven-22-be-1174882837.webp', N'Màu sắc', N'Kích thước', 1),
        (26, 15, 1, N'Áo thun Non Branded 01',      N'ao-thun-non-branded-01',      N'Áo thun cổ tròn basic, chất cotton thoáng mát',
          N'/uploads/products/ao/ao-thun-non-branded-01-den-1174882387.webp', N'Kích thước', NULL, 1),
        (27, 15, 1, N'Áo thun Seventy Seven 04',    N'ao-thun-seventy-seven-04',    N'Áo thun cổ tròn viền sọc, form vừa vặn thời trang',
          N'/uploads/products/ao/ao-thun-seventy-seven-04-tr-ng-1174883207.webp', N'Màu sắc', N'Kích thước', 1),
        (28, 15, 1, N'Áo thun Seventy Seven 10',    N'ao-thun-seventy-seven-10',    N'Áo thun oversize phong cách đường phố, logo metal',
          N'/uploads/products/ao/ao-thun-seventy-seven-10-den-1174883597.webp', N'Kích thước', NULL, 1),
        (29, 15, 1, N'Áo thun Seventy Seven 13',    N'ao-thun-seventy-seven-13',    N'Áo thun cổ tròn viền sọc raglan, đa dạng màu sắc',
          N'/uploads/products/ao/ao-thun-seventy-seven-13-be-1174883511.webp', N'Màu sắc', N'Kích thước', 1),
        (30, 6,  5, N'Quần jean The Original 28',   N'quan-jean-the-original-28',   N'Quần jean nam dáng slim, vải denim co giãn thoải mái',
          N'/uploads/products/quan/quan-jean-the-original-28-xanh-d-ng-1174882630.webp', N'Màu sắc', N'Kích thước', 1),
        (31, 6,  5, N'Quần jean The Original M101',  N'quan-jean-the-original-m101', N'Quần jean nam dáng rộng, chất liệu denim mềm',
          N'/uploads/products/quan/quan-jean-the-original-m101-xanh-d-ng-1174882525.webp', N'Kích thước', NULL, 1),
        (32, 6,  5, N'Quần short Non Branded 05',   N'quan-short-non-branded-05',   N'Quần short nam thun, lưng chun thoải mái, nhiều màu',
          N'/uploads/products/quan/quan-short-non-branded-05-be-1174882076.webp', N'Màu sắc', N'Kích thước', 1),
        (33, 9,  2, N'ASUS TUF Gaming F15',         N'asus-tuf-gaming-f15',         N'Laptop gaming ASUS TUF, bàn phím RGB, tản nhiệt hiệu quả',
          N'/uploads/products/laptop/1711078092373-asus-01.png', NULL, NULL, 1),
        (34, 9,  2, N'Dell Inspiron 15 3530',        N'dell-inspiron-15-3530',       N'Laptop Dell Inspiron 15 inch, mỏng nhẹ cho văn phòng',
          N'/uploads/products/laptop/1711078452562-dell-01.png', NULL, NULL, 1),
        (35, 9,  2, N'Lenovo IdeaPad Gaming 3',     N'lenovo-ideapad-gaming-3',     N'Laptop gaming Lenovo IdeaPad, hiệu năng mạnh mẽ',
          N'/uploads/products/laptop/1711079073759-lenovo-01.png', NULL, NULL, 1),
        (36, 9,  2, N'ASUS VivoBook X541',           N'asus-vivobook-x541',          N'Laptop ASUS VivoBook phổ thông, nhẹ nhàng cho học sinh',
          N'/uploads/products/laptop/1711079496409-asus-02.png', NULL, NULL, 1),
        (37, 9,  2, N'MacBook Pro M2 13 inch',       N'macbook-pro-m2',              N'MacBook Pro chip M2, màn Retina 13.3 inch, hiệu năng chuyên nghiệp',
          N'/uploads/products/laptop/1711079954090-apple-01.png', NULL, NULL, 1),
        (38, 9,  2, N'LG Gram 15 2024',              N'lg-gram-15-2024',             N'Laptop LG Gram siêu nhẹ, pin trâu, màn hình IPS sắc nét',
          N'/uploads/products/laptop/1711080386941-lg-01.png', NULL, NULL, 1),
        (39, 9,  2, N'MacBook Air M2',               N'macbook-air-m2',              N'MacBook Air chip M2, thiết kế mỏng nhẹ, Liquid Retina',
          N'/uploads/products/laptop/1711080787179-apple-02.png', NULL, NULL, 1),
        (40, 9,  2, N'Acer Nitro 5 Gaming',          N'acer-nitro-5',                N'Laptop gaming Acer Nitro, Intel + NVIDIA, hiệu năng cao',
          N'/uploads/products/laptop/1711080948771-acer-01.png', NULL, NULL, 1),
        (41, 9,  2, N'ASUS Vivobook Pro 15 OLED',    N'asus-vivobook-pro-15-oled',   N'Laptop ASUS Vivobook Pro, màn OLED 15 inch sắc nét',
          N'/uploads/products/laptop/1711081080930-asus-03.png', NULL, NULL, 1),
        (42, 9,  2, N'Dell Vostro 15 3530',          N'dell-vostro-15-3530',         N'Laptop Dell Vostro doanh nghiệp, Core i5, bền bỉ tin cậy',
          N'/uploads/products/laptop/1711081278418-dell-02.png', NULL, NULL, 1),
        (43, 18, 6, N'Nón lưỡi trai Non Branded 12', N'non-luoi-trai-non-branded-12', N'Nón lưỡi trai thoáng khí, chất liệu nhẹ chống UV',
          N'/uploads/products/phu-kien/non-non-branded-12-be-1174878916.webp', NULL, NULL, 1),
        (44, 18, 6, N'Nón Y2010 02',                 N'non-y2010-02',                N'Nón bucket đen Y2010, phong cách streetwear',
          N'/uploads/products/phu-kien/non-y2010-02-den-1174879791.webp', NULL, NULL, 1),
        (45, 18, 6, N'Nón Y2010 04',                 N'non-y2010-04',                N'Nón bucket xanh đen Y2010, chất liệu bền đẹp',
          N'/uploads/products/phu-kien/non-y2010-04-xanh-den-1174878969.webp', NULL, NULL, 1),
        (46, 18, 6, N'Bộ gối thể thao Beginner 87',  N'bo-goi-the-thao-beginner-87', N'Bộ đệm bảo vệ đầu gối khi tập gym, chạy bộ',
          N'/uploads/products/phu-kien/bo-g-i-th-thao-beginner-87-1174879762.webp', NULL, NULL, 1),
        (47, 18, 6, N'Dây nịt Y2010 D15',            N'day-nit-y2010-d15',           N'Dây nịt da đen Y2010, khóa tự động sang trọng',
          N'/uploads/products/phu-kien/day-n-t-y2010-d15-den-1174880703.webp', NULL, NULL, 1),
        (48, 18, 6, N'Túi đeo chéo Y2010 34',        N'tui-deo-cheo-y2010-34',       N'Túi đeo chéo Y2010 đen, thiết kế tối giản chống nước',
          N'/uploads/products/phu-kien/tui-deo-y2010-34-den-1174880785.webp', NULL, NULL, 1),
        (49, 18, 6, N'Ví da Y2010 02',               N'vi-da-y2010-02',              N'Ví đứng da Y2010, thiết kế nhỏ gọn nhiều ngăn',
          N'/uploads/products/phu-kien/vi-y2010-02-den-1174880616.jpg', NULL, NULL, 1),
        (50, 18, 6, N'Ví da Y2010 05',               N'vi-da-y2010-05',              N'Ví ngang da Y2010, kiểu dáng lịch lãm',
          N'/uploads/products/phu-kien/vi-y2010-05-den-1174880343.webp', NULL, NULL, 1);
      SET IDENTITY_INSERT products OFF;
    `);
    console.log('  + products: +30 rows (21-50)');

    // ── New Product Variants — Fashion (42 variants) ──
    await qr.query(`
      SET IDENTITY_INSERT product_variants ON;
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        -- P21: Áo khoác Non Branded 04 (4 colors × M,L)
        (47, 21, N'AK-NB04-DEN-M',  N'Đen',       N'M', 550000, 479000, 30),
        (48, 21, N'AK-NB04-DEN-L',  N'Đen',       N'L', 550000, 479000, 25),
        (49, 21, N'AK-NB04-HONG-M', N'Hồng',      N'M', 550000, 479000, 20),
        (50, 21, N'AK-NB04-HONG-L', N'Hồng',      N'L', 550000, 479000, 15),
        (51, 21, N'AK-NB04-XAM-M',  N'Xám đậm',   N'M', 550000, NULL,   25),
        (52, 21, N'AK-NB04-XAM-L',  N'Xám đậm',   N'L', 550000, NULL,   20),
        (53, 21, N'AK-NB04-XR-M',   N'Xanh rêu',  N'M', 550000, NULL,   20),
        (54, 21, N'AK-NB04-XR-L',   N'Xanh rêu',  N'L', 550000, NULL,   15),
        -- P22: Áo khoác The Beginner M006 (2 colors × M,L)
        (55, 22, N'AK-TBM6-DEN-M',  N'Đen',       N'M', 650000, 569000, 20),
        (56, 22, N'AK-TBM6-DEN-L',  N'Đen',       N'L', 650000, 569000, 15),
        (57, 22, N'AK-TBM6-XR-M',   N'Xanh rêu',  N'M', 650000, NULL,   18),
        (58, 22, N'AK-TBM6-XR-L',   N'Xanh rêu',  N'L', 650000, NULL,   12),
        -- P23: Áo sơ mi Non Branded 19 (size only)
        (59, 23, N'ASM-NB19-M',     N'M',  NULL, 380000, 329000, 25),
        (60, 23, N'ASM-NB19-L',     N'L',  NULL, 380000, 329000, 20),
        (61, 23, N'ASM-NB19-XL',    N'XL', NULL, 380000, NULL,   15),
        -- P24: Áo sơ mi Non Branded 33 (3 colors × M,L)
        (62, 24, N'ASM-NB33-DEN-M', N'Đen',        N'M', 420000, 369000, 20),
        (63, 24, N'ASM-NB33-DEN-L', N'Đen',        N'L', 420000, 369000, 15),
        (64, 24, N'ASM-NB33-TR-M',  N'Trắng',      N'M', 420000, NULL,   25),
        (65, 24, N'ASM-NB33-TR-L',  N'Trắng',      N'L', 420000, NULL,   20),
        (66, 24, N'ASM-NB33-XD-M',  N'Xanh dương', N'M', 420000, NULL,   20),
        (67, 24, N'ASM-NB33-XD-L',  N'Xanh dương', N'L', 420000, NULL,   15),
        -- P25: Áo sơ mi Seventy Seven 22 (2 colors × M,L)
        (68, 25, N'ASM-SS22-BE-M',  N'Be',  N'M', 450000, 389000, 20),
        (69, 25, N'ASM-SS22-BE-L',  N'Be',  N'L', 450000, 389000, 15),
        (70, 25, N'ASM-SS22-DEN-M', N'Đen', N'M', 450000, NULL,   18),
        (71, 25, N'ASM-SS22-DEN-L', N'Đen', N'L', 450000, NULL,   12),
        -- P26: Áo thun Non Branded 01 (size only)
        (72, 26, N'AT-NB01-M',      N'M',  NULL, 250000, 199000, 40),
        (73, 26, N'AT-NB01-L',      N'L',  NULL, 250000, 199000, 35),
        (74, 26, N'AT-NB01-XL',     N'XL', NULL, 250000, NULL,   25),
        -- P27: Áo thun Seventy Seven 04 (2 colors × M,L)
        (75, 27, N'AT-SS04-TR-M',   N'Trắng',    N'M', 320000, 269000, 25),
        (76, 27, N'AT-SS04-TR-L',   N'Trắng',    N'L', 320000, 269000, 20),
        (77, 27, N'AT-SS04-XG-M',   N'Xám ghi',  N'M', 320000, NULL,   22),
        (78, 27, N'AT-SS04-XG-L',   N'Xám ghi',  N'L', 320000, NULL,   18),
        -- P28: Áo thun Seventy Seven 10 (size only)
        (79, 28, N'AT-SS10-M',      N'M', NULL, 290000, 249000, 30),
        (80, 28, N'AT-SS10-L',      N'L', NULL, 290000, 249000, 25),
        -- P29: Áo thun Seventy Seven 13 (4 colors × M,L)
        (81, 29, N'AT-SS13-BE-M',   N'Be',    N'M', 280000, 239000, 25),
        (82, 29, N'AT-SS13-BE-L',   N'Be',    N'L', 280000, 239000, 20),
        (83, 29, N'AT-SS13-DEN-M',  N'Đen',   N'M', 280000, NULL,   30),
        (84, 29, N'AT-SS13-DEN-L',  N'Đen',   N'L', 280000, NULL,   25),
        (85, 29, N'AT-SS13-TR-M',   N'Trắng', N'M', 280000, NULL,   20),
        (86, 29, N'AT-SS13-TR-L',   N'Trắng', N'L', 280000, NULL,   15),
        (87, 29, N'AT-SS13-XAM-M',  N'Xám',   N'M', 280000, NULL,   22),
        (88, 29, N'AT-SS13-XAM-L',  N'Xám',   N'L', 280000, NULL,   18);
      SET IDENTITY_INSERT product_variants OFF;
    `);
    console.log('  + product_variants: +42 rows (47-88) — fashion');

    // ── New Product Variants — Pants, Laptops, Accessories (35 variants) ──
    await qr.query(`
      SET IDENTITY_INSERT product_variants ON;
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        -- P30: Quần jean The Original 28 (3 colors × 30,32)
        (89,  30, N'QJ-TO28-DEN-30',  N'Đen',        N'30', 520000, 459000, 20),
        (90,  30, N'QJ-TO28-DEN-32',  N'Đen',        N'32', 520000, 459000, 18),
        (91,  30, N'QJ-TO28-XDM-30',  N'Xanh đậm',   N'30', 520000, NULL,   22),
        (92,  30, N'QJ-TO28-XDM-32',  N'Xanh đậm',   N'32', 520000, NULL,   20),
        (93,  30, N'QJ-TO28-XDG-30',  N'Xanh dương',  N'30', 520000, NULL,   18),
        (94,  30, N'QJ-TO28-XDG-32',  N'Xanh dương',  N'32', 520000, NULL,   15),
        -- P31: Quần jean The Original M101 (size only)
        (95,  31, N'QJ-TOM101-29',    N'29', NULL, 480000, 419000, 15),
        (96,  31, N'QJ-TOM101-30',    N'30', NULL, 480000, 419000, 20),
        (97,  31, N'QJ-TOM101-32',    N'32', NULL, 480000, NULL,   18),
        -- P32: Quần short Non Branded 05 (4 colors × M,L)
        (98,  32, N'QS-NB05-BE-M',    N'Be',       N'M', 320000, 269000, 25),
        (99,  32, N'QS-NB05-BE-L',    N'Be',       N'L', 320000, 269000, 20),
        (100, 32, N'QS-NB05-DEN-M',   N'Đen',      N'M', 320000, NULL,   30),
        (101, 32, N'QS-NB05-DEN-L',   N'Đen',      N'L', 320000, NULL,   25),
        (102, 32, N'QS-NB05-NR-M',    N'Nâu rêu',  N'M', 320000, NULL,   20),
        (103, 32, N'QS-NB05-NR-L',    N'Nâu rêu',  N'L', 320000, NULL,   15),
        (104, 32, N'QS-NB05-XD-M',    N'Xanh đen', N'M', 320000, NULL,   22),
        (105, 32, N'QS-NB05-XD-L',    N'Xanh đen', N'L', 320000, NULL,   18),
        -- P33-P42: Laptops (1 variant each)
        (106, 33, N'ASUS-TUF-F15',    NULL, NULL, 18990000, 16990000, 8),
        (107, 34, N'DELL-INS-3530',   NULL, NULL, 15990000, 14490000, 10),
        (108, 35, N'LNV-IPG3',        NULL, NULL, 19990000, 17990000, 6),
        (109, 36, N'ASUS-VB-X541',    NULL, NULL,  9990000,  8490000, 12),
        (110, 37, N'MBP-M2-13',       NULL, NULL, 29990000, 27990000, 5),
        (111, 38, N'LG-GRAM-15',      NULL, NULL, 25990000, 23990000, 7),
        (112, 39, N'MBA-M2-13',       NULL, NULL, 24990000, 22990000, 8),
        (113, 40, N'ACER-NITRO5',     NULL, NULL, 22990000, 20990000, 6),
        (114, 41, N'ASUS-VBP15',      NULL, NULL, 21990000, 19990000, 7),
        (115, 42, N'DELL-VOS-3530',   NULL, NULL, 14990000, 13490000, 10),
        -- P43-P50: Phụ kiện thời trang (1 variant each)
        (116, 43, N'NON-NB12',        NULL, NULL, 280000, 239000, 35),
        (117, 44, N'NON-Y2010-02',    NULL, NULL, 320000, 269000, 30),
        (118, 45, N'NON-Y2010-04',    NULL, NULL, 320000, NULL,   25),
        (119, 46, N'GTTB-BG87',       NULL, NULL, 189000, 149000, 40),
        (120, 47, N'DNIT-Y2010-D15',  NULL, NULL, 290000, 249000, 25),
        (121, 48, N'TDC-Y2010-34',    NULL, NULL, 520000, 449000, 15),
        (122, 49, N'VDA-Y2010-02',    NULL, NULL, 390000, 329000, 20),
        (123, 50, N'VDA-Y2010-05',    NULL, NULL, 450000, 379000, 18);
      SET IDENTITY_INSERT product_variants OFF;
    `);
    console.log(
      '  + product_variants: +35 rows (89-123) — pants/laptops/accessories',
    );

    // ── New Product Images (52) ──
    await qr.query(`
      SET IDENTITY_INSERT product_images ON;
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        -- P21: Áo khoác NB04 (4 color images)
        (42, 21, N'/uploads/products/ao/ao-khoac-non-branded-04-den-1174884707.webp',      0, N'Đen'),
        (43, 21, N'/uploads/products/ao/ao-khoac-non-branded-04-h-ng-1174884689.webp',     0, N'Hồng'),
        (44, 21, N'/uploads/products/ao/ao-khoac-non-branded-04-xam-d-m-1174884510.webp',  0, N'Xám đậm'),
        (45, 21, N'/uploads/products/ao/ao-khoac-non-branded-04-xanh-reu-1174884672.webp', 0, N'Xanh rêu'),
        -- P22: Áo khoác TB M006 (2 color images)
        (46, 22, N'/uploads/products/ao/ao-khoac-the-beginner-m006-den-1177437004.webp',     0, N'Đen'),
        (47, 22, N'/uploads/products/ao/ao-khoac-the-beginner-m006-xanh-reu-1177436985.webp',0, N'Xanh rêu'),
        -- P23: Áo sơ mi NB19 (1 shared)
        (48, 23, N'/uploads/products/ao/ao-so-mi-non-branded-19-tr-ng-1174884380.webp', 0, NULL),
        -- P24: Áo sơ mi NB33 (3 color images)
        (49, 24, N'/uploads/products/ao/ao-so-mi-non-branded-33-den-1174884163.webp',      0, N'Đen'),
        (50, 24, N'/uploads/products/ao/ao-so-mi-non-branded-33-tr-ng-1174884128.webp',    0, N'Trắng'),
        (51, 24, N'/uploads/products/ao/ao-so-mi-non-branded-33-xanh-d-ng-1174884119.webp',0, N'Xanh dương'),
        -- P25: Áo sơ mi SS22 (2 color images)
        (52, 25, N'/uploads/products/ao/ao-so-mi-seventy-seven-22-be-1174882837.webp',  0, N'Be'),
        (53, 25, N'/uploads/products/ao/ao-so-mi-seventy-seven-22-den-1174882869.webp', 0, N'Đen'),
        -- P26: Áo thun NB01 (1 shared)
        (54, 26, N'/uploads/products/ao/ao-thun-non-branded-01-den-1174882387.webp', 0, NULL),
        -- P27: Áo thun SS04 (2 color + 4 shared detail/size chart)
        (55, 27, N'/uploads/products/ao/ao-thun-seventy-seven-04-tr-ng-1174883207.webp',        0, N'Trắng'),
        (56, 27, N'/uploads/products/ao/ao-thun-seventy-seven-04-xam-ghi-1174883153.webp',     0, N'Xám ghi'),
        (57, 27, N'/uploads/products/ao-detail/ao-thun-seventy-seven-04-h-ng-1174883166.webp', 0, NULL),
        (58, 27, N'/uploads/products/ao-detail/ao-thun-seventy-seven-04-h-ng-1174883170.webp', 1, NULL),
        (59, 27, N'/uploads/products/ao-detail/size-ao-1.webp', 2, NULL),
        (60, 27, N'/uploads/products/ao-detail/size-ao-2.webp', 3, NULL),
        -- P28: Áo thun SS10 (1 shared)
        (61, 28, N'/uploads/products/ao/ao-thun-seventy-seven-10-den-1174883597.webp', 0, NULL),
        -- P29: Áo thun SS13 (4 color images)
        (62, 29, N'/uploads/products/ao/ao-thun-seventy-seven-13-be-1174883511.webp',  0, N'Be'),
        (63, 29, N'/uploads/products/ao/ao-thun-seventy-seven-13-den-1174883530.webp', 0, N'Đen'),
        (64, 29, N'/uploads/products/ao/ao-thun-seventy-seven-13-tr-ng-1174883539.webp',0, N'Trắng'),
        (65, 29, N'/uploads/products/ao/ao-thun-seventy-seven-13-xam-1174883483.webp', 0, N'Xám'),
        -- P30: Quần jean TO28 (3 color images)
        (66, 30, N'/uploads/products/quan/quan-jean-the-original-28-den-1174882647.webp',        0, N'Đen'),
        (67, 30, N'/uploads/products/quan/quan-jean-the-original-28-xanh-d-m-1-1174882642.webp', 0, N'Xanh đậm'),
        (68, 30, N'/uploads/products/quan/quan-jean-the-original-28-xanh-d-ng-1174882630.webp',  0, N'Xanh dương'),
        -- P31: Quần jean TO M101 (1 shared)
        (69, 31, N'/uploads/products/quan/quan-jean-the-original-m101-xanh-d-ng-1174882525.webp', 0, NULL),
        -- P32: Quần short NB05 (4 color + 2 shared detail)
        (70, 32, N'/uploads/products/quan/quan-short-non-branded-05-be-1174882076.webp',      0, N'Be'),
        (71, 32, N'/uploads/products/quan/quan-short-non-branded-05-den-1174882099.webp',     0, N'Đen'),
        (72, 32, N'/uploads/products/quan/quan-short-non-branded-05-nau-reu-1174882113.webp', 0, N'Nâu rêu'),
        (73, 32, N'/uploads/products/quan/quan-short-non-branded-05-xanh-den-1174882061.webp',0, N'Xanh đen'),
        (74, 32, N'/uploads/products/quan-detail/qu-n-short-non-branded-05-den-1174882100.webp', 1, NULL),
        (75, 32, N'/uploads/products/quan-detail/QU._SHORT.webp', 2, NULL),
        -- P33-P42: Laptops (1 each)
        (76, 33, N'/uploads/products/laptop/1711078092373-asus-01.png',  0, NULL),
        (77, 34, N'/uploads/products/laptop/1711078452562-dell-01.png',  0, NULL),
        (78, 35, N'/uploads/products/laptop/1711079073759-lenovo-01.png',0, NULL),
        (79, 36, N'/uploads/products/laptop/1711079496409-asus-02.png',  0, NULL),
        (80, 37, N'/uploads/products/laptop/1711079954090-apple-01.png', 0, NULL),
        (81, 38, N'/uploads/products/laptop/1711080386941-lg-01.png',    0, NULL),
        (82, 39, N'/uploads/products/laptop/1711080787179-apple-02.png', 0, NULL),
        (83, 40, N'/uploads/products/laptop/1711080948771-acer-01.png',  0, NULL),
        (84, 41, N'/uploads/products/laptop/1711081080930-asus-03.png',  0, NULL),
        (85, 42, N'/uploads/products/laptop/1711081278418-dell-02.png',  0, NULL),
        -- P43-P50: Phụ kiện thời trang (1 each)
        (86, 43, N'/uploads/products/phu-kien/non-non-branded-12-be-1174878916.webp',     0, NULL),
        (87, 44, N'/uploads/products/phu-kien/non-y2010-02-den-1174879791.webp',          0, NULL),
        (88, 45, N'/uploads/products/phu-kien/non-y2010-04-xanh-den-1174878969.webp',     0, NULL),
        (89, 46, N'/uploads/products/phu-kien/bo-g-i-th-thao-beginner-87-1174879762.webp',0, NULL),
        (90, 47, N'/uploads/products/phu-kien/day-n-t-y2010-d15-den-1174880703.webp',     0, NULL),
        (91, 48, N'/uploads/products/phu-kien/tui-deo-y2010-34-den-1174880785.webp',      0, NULL),
        (92, 49, N'/uploads/products/phu-kien/vi-y2010-02-den-1174880616.jpg',             0, NULL),
        (93, 50, N'/uploads/products/phu-kien/vi-y2010-05-den-1174880343.webp',            0, NULL);
      SET IDENTITY_INSERT product_images OFF;
    `);
    console.log('  + product_images: +52 rows (42-93)');

    // ══════════════════════════════════════════════════════════════
    // ── EXTRA SEED DATA — more products across multiple shops ──────
    //    (curated Unsplash images downloaded to /uploads/products/seed)
    // ══════════════════════════════════════════════════════════════

    // ── Extra Products (18) — shops 2,3,4,6,7 ──
    // Shop 4 Books (51-56), Shop 3 Home (57-60), Shop 7 Shoes (61-65),
    // Shop 2 Electronics (66), Shop 6 Accessories (67-68)
    await qr.query(`
      SET IDENTITY_INSERT products ON;
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (51, 13, 4, N'Tôi Tài Giỏi, Bạn Cũng Thế', N'toi-tai-gioi-ban-cung-the', N'Adam Khoo - Bí quyết học tập và thành công',        N'/uploads/products/seed/p51.jpg', NULL, NULL, 1),
        (52, 13, 4, N'Cà Phê Cùng Tony',           N'ca-phe-cung-tony',           N'Tony Buổi Sáng - Góc nhìn khởi nghiệp và cuộc sống', N'/uploads/products/seed/p52.jpg', NULL, NULL, 1),
        (53, 14, 4, N'Muôn Kiếp Nhân Sinh',        N'muon-kiep-nhan-sinh',        N'Nguyên Phong - Tiểu thuyết về luân hồi và nhân quả', N'/uploads/products/seed/p53.jpg', NULL, NULL, 1),
        (54, 13, 4, N'Tuổi Trẻ Đáng Giá Bao Nhiêu', N'tuoi-tre-dang-gia-bao-nhieu', N'Rosie Nguyễn - Sách kỹ năng cho người trẻ',         N'/uploads/products/seed/p54.jpg', NULL, NULL, 1),
        (55, 14, 4, N'Hoàng Tử Bé',                N'hoang-tu-be',                N'Antoine de Saint-Exupéry - Kiệt tác văn học thiếu nhi', N'/uploads/products/seed/p55.jpg', NULL, NULL, 1),
        (56, 13, 4, N'Sapiens: Lược Sử Loài Người', N'sapiens-luoc-su-loai-nguoi', N'Yuval Noah Harari - Lịch sử tiến hóa loài người',   N'/uploads/products/seed/p56.jpg', NULL, NULL, 1),
        (57, 11, 3, N'Ghế Sofa Da 3 Chỗ',          N'ghe-sofa-da-3-cho',          N'Sofa da PU cao cấp, khung gỗ tự nhiên, 3 chỗ ngồi',  N'/uploads/products/seed/p57.jpg', NULL, NULL, 1),
        (58, 11, 3, N'Đèn Bàn LED Chống Cận',      N'den-ban-led-chong-can',      N'Đèn bàn LED bảo vệ mắt, 3 chế độ sáng, cắm USB',     N'/uploads/products/seed/p58.jpg', NULL, NULL, 1),
        (59, 11, 3, N'Kệ Sách Gỗ 5 Tầng',          N'ke-sach-go-5-tang',          N'Kệ sách gỗ tự nhiên 5 tầng, chắc chắn, dễ lắp ráp',  N'/uploads/products/seed/p59.jpg', NULL, NULL, 1),
        (60, 12, 3, N'Bộ Nồi Inox 5 Món',          N'bo-noi-inox-5-mon',          N'Bộ nồi inox 304 cao cấp 5 món, dùng mọi loại bếp',   N'/uploads/products/seed/p60.jpg', NULL, NULL, 1),
        (61, 7,  7, N'Giày Chạy Bộ Nam',           N'giay-chay-bo-nam',           N'Giày chạy bộ đế êm, thoáng khí, hỗ trợ vận động',    N'/uploads/products/seed/p61.jpg', N'Kích thước', NULL, 1),
        (62, 7,  7, N'Giày Sneaker Cổ Điển',       N'giay-sneaker-co-dien',       N'Giày sneaker phong cách cổ điển, dễ phối đồ',        N'/uploads/products/seed/p62.jpg', N'Kích thước', NULL, 1),
        (63, 7,  7, N'Giày Sneaker Cao Cổ',        N'giay-sneaker-cao-co',        N'Giày sneaker cao cổ năng động, cá tính',             N'/uploads/products/seed/p63.jpg', N'Kích thước', NULL, 1),
        (64, 7,  7, N'Sandal Quai Hậu Nam',        N'sandal-quai-hau-nam',        N'Sandal quai hậu chắc chắn, đế chống trơn',          N'/uploads/products/seed/p64.jpg', N'Kích thước', NULL, 1),
        (65, 7,  7, N'Dép Lê Nam',                 N'dep-le-nam',                 N'Dép lê nam êm nhẹ, phù hợp đi trong nhà và dạo phố', N'/uploads/products/seed/p65.jpg', N'Kích thước', NULL, 1),
        (66, 8,  2, N'Xiaomi Redmi Note 13',       N'xiaomi-redmi-note-13',       N'Xiaomi Redmi Note 13, màn AMOLED, pin 5000mAh',     N'/uploads/products/seed/p66.jpg', N'Dung lượng', N'Màu', 1),
        (67, 10, 6, N'Tai Nghe Chụp Tai Bluetooth', N'tai-nghe-chup-tai-bluetooth', N'Tai nghe over-ear chống ồn, pin 30 giờ',            N'/uploads/products/seed/p67.jpg', NULL, NULL, 1),
        (68, 10, 6, N'Pin Sạc Dự Phòng 20000mAh',  N'pin-sac-du-phong-20000mah',  N'Pin dự phòng 20000mAh, sạc nhanh PD 22.5W',          N'/uploads/products/seed/p68.jpg', NULL, NULL, 1);
      SET IDENTITY_INSERT products OFF;
    `);
    console.log(
      '  + products: +18 rows (51-68) — books/home/shoes/electronics/accessories',
    );

    // ── Extra Product Variants (21) ──
    // Books/home/accessories: 1 variant each. Shoes: size variants. Phone: 2 variants.
    await qr.query(`
      SET IDENTITY_INSERT product_variants ON;
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        (124, 51, N'SACH-TTG',       NULL,     NULL, 110000,  89000,   60),
        (125, 52, N'SACH-TONY',      NULL,     NULL, 95000,   79000,   55),
        (126, 53, N'SACH-MKNS',      NULL,     NULL, 160000,  135000,  40),
        (127, 54, N'SACH-TTDG',      NULL,     NULL, 90000,   75000,   70),
        (128, 55, N'SACH-HTB',       NULL,     NULL, 75000,   59000,   80),
        (129, 56, N'SACH-SAP',       NULL,     NULL, 220000,  179000,  35),
        (130, 57, N'NOI-SOFA3',      NULL,     NULL, 8500000, 7490000, 6),
        (131, 58, N'NOI-DENLED',     NULL,     NULL, 350000,  279000,  40),
        (132, 59, N'NOI-KE5T',       NULL,     NULL, 1200000, 990000,  15),
        (133, 60, N'BEP-NOI5',       NULL,     NULL, 1500000, 1190000, 20),
        (134, 61, N'GIAY-CHAY-41',   N'41',    NULL, 950000,  790000,  20),
        (135, 61, N'GIAY-CHAY-42',   N'42',    NULL, 950000,  790000,  18),
        (136, 62, N'GIAY-SNCD-42',   N'42',    NULL, 850000,  699000,  20),
        (137, 63, N'GIAY-SNCC-42',   N'42',    NULL, 990000,  849000,  18),
        (138, 64, N'DEP-SDLQH-42',   N'42',    NULL, 320000,  269000,  30),
        (139, 65, N'DEP-LE-42',      N'42',    NULL, 180000,  149000,  45),
        (140, 66, N'DT-XIAOMI-128-XL', N'128GB', N'Xanh lá', 6490000, 5990000, 20),
        (141, 66, N'DT-XIAOMI-256-DEN', N'256GB', N'Đen',    7490000, NULL,    15),
        (142, 67, N'TN-CHUP-BT',     NULL,     NULL, 1200000, 990000,  25),
        (143, 68, N'PIN-20K',        NULL,     NULL, 590000,  490000,  40);
      SET IDENTITY_INSERT product_variants OFF;
    `);
    console.log('  + product_variants: +20 rows (124-143) — extra products');

    // ── Extra Product Images (18) — one shared image per product ──
    await qr.query(`
      SET IDENTITY_INSERT product_images ON;
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        (94,  51, N'/uploads/products/seed/p51.jpg', 0, NULL),
        (95,  52, N'/uploads/products/seed/p52.jpg', 0, NULL),
        (96,  53, N'/uploads/products/seed/p53.jpg', 0, NULL),
        (97,  54, N'/uploads/products/seed/p54.jpg', 0, NULL),
        (98,  55, N'/uploads/products/seed/p55.jpg', 0, NULL),
        (99,  56, N'/uploads/products/seed/p56.jpg', 0, NULL),
        (100, 57, N'/uploads/products/seed/p57.jpg', 0, NULL),
        (101, 58, N'/uploads/products/seed/p58.jpg', 0, NULL),
        (102, 59, N'/uploads/products/seed/p59.jpg', 0, NULL),
        (103, 60, N'/uploads/products/seed/p60.jpg', 0, NULL),
        (104, 61, N'/uploads/products/seed/p61.jpg', 0, NULL),
        (105, 62, N'/uploads/products/seed/p62.jpg', 0, NULL),
        (106, 63, N'/uploads/products/seed/p63.jpg', 0, NULL),
        (107, 64, N'/uploads/products/seed/p64.jpg', 0, NULL),
        (108, 65, N'/uploads/products/seed/p65.jpg', 0, NULL),
        (109, 66, N'/uploads/products/seed/p66.jpg', 0, NULL),
        (110, 67, N'/uploads/products/seed/p67.jpg', 0, NULL),
        (111, 68, N'/uploads/products/seed/p68.jpg', 0, NULL);
      SET IDENTITY_INSERT product_images OFF;
    `);
    console.log('  + product_images: +18 rows (94-111) — extra products');

    await qr.release();
  },
};
