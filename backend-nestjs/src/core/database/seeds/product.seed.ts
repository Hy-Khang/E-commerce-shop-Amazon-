import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

// Seed images live in the Supabase Storage bucket (uploaded from local uploads/**
// alongside this seed). Build the public base from env so no project ref is
// hardcoded; falls back to a relative path if Supabase env is absent.
const IMG_BASE =
  process.env.SUPABASE_URL && process.env.SUPABASE_BUCKET
    ? `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}`
    : '';

export const ProductSeed: ISeed = {
  name: 'product',
  order: 3,
  tables: ['product_images', 'product_variants', 'products', 'categories'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // ── Categories (4 root + 8 sub + 4 sub-sub = 16) ──
    await qr.query(`
      INSERT INTO categories (id, parent_id, name, slug) VALUES
        (1,  NULL, 'Thời trang',          'thoi-trang'),
        (2,  NULL, 'Điện tử',             'dien-tu'),
        (3,  NULL, 'Nhà cửa & Đời sống', 'nha-cua-doi-song'),
        (4,  NULL, 'Sách',                'sach'),
        (5,  1, 'Áo nam',                'ao-nam'),
        (6,  1, 'Quần nam',              'quan-nam'),
        (7,  1, 'Giày dép',              'giay-dep'),
        (8,  2, 'Điện thoại',            'dien-thoai'),
        (9,  2, 'Laptop',                'laptop'),
        (10, 2, 'Phụ kiện',              'phu-kien'),
        (11, 3, 'Nội thất',              'noi-that'),
        (12, 3, 'Đồ dùng nhà bếp',      'do-dung-nha-bep'),
        (13, 4, 'Sách kỹ năng',          'sach-ky-nang'),
        (14, 4, 'Sách văn học',           'sach-van-hoc'),
        (15, 5, 'Áo thun',               'ao-thun'),
        (16, 5, 'Áo sơ mi',              'ao-so-mi');
    `);
    console.log('  + categories: 16 rows');

    // ── Products (20) — distributed across 7 shops ──
    // Shop 1: fashion tops (1-3), Shop 2: electronics (8-11), Shop 3: home (14-17)
    // Shop 4: books (18-20), Shop 5: fashion bottoms (4-5), Shop 6: accessories (12-13), Shop 7: shoes (6-7)
    await qr.query(`
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (1,  15, 1, 'Áo thun nam basic cotton',       'ao-thun-nam-basic-cotton',       'Áo thun nam chất liệu cotton 100%, thoáng mát',           '${IMG_BASE}/products/seed/p1.jpg',    'Màu sắc',    'Kích thước', true),
        (2,  15, 1, 'Áo thun nam oversize',            'ao-thun-nam-oversize',            'Áo thun form rộng phong cách Hàn Quốc',                    '${IMG_BASE}/products/seed/p2.jpg', 'Màu sắc',    'Kích thước', true),
        (3,  16, 1, 'Áo sơ mi nam Oxford',             'ao-so-mi-nam-oxford',             'Áo sơ mi Oxford dáng slim fit, vải dày dặn',               '${IMG_BASE}/products/seed/p3.jpg',  'Màu sắc',    'Kích thước', true),
        (4,  6,  5, 'Quần jean nam slim fit',          'quan-jean-nam-slim-fit',          'Quần jean co giãn, dáng ôm vừa phải',                      '${IMG_BASE}/products/seed/p4.jpg',   'Màu sắc',    'Kích thước', true),
        (5,  6,  5, 'Quần kaki nam',                   'quan-kaki-nam',                   'Quần kaki nam form regular, vải mềm',                       '${IMG_BASE}/products/seed/p5.jpg',        'Màu sắc',    'Kích thước', true),
        (6,  7,  7, 'Giày sneaker trắng',              'giay-sneaker-trang',              'Giày sneaker trắng basic, đế cao su bền',                   '${IMG_BASE}/products/seed/p6.jpg',    'Kích thước', NULL, true),
        (7,  7,  7, 'Dép quai ngang nam',              'dep-quai-ngang-nam',              'Dép quai ngang êm chân, phù hợp đi hàng ngày',             '${IMG_BASE}/products/seed/p7.jpg',   'Kích thước', NULL, true),
        (8,  8,  2, 'iPhone 15 Pro Max',               'iphone-15-pro-max',               'iPhone 15 Pro Max chip A17 Pro, camera 48MP',                '${IMG_BASE}/products/seed/p8.jpg', 'Dung lượng', 'Màu', true),
        (9,  8,  2, 'Samsung Galaxy S24 Ultra',        'samsung-galaxy-s24-ultra',        'Samsung Galaxy S24 Ultra, S Pen tích hợp',                  '${IMG_BASE}/products/seed/p9.jpg',      'Dung lượng', 'Màu', true),
        (10, 9,  2, 'MacBook Air M3',                  'macbook-air-m3',                  'MacBook Air chip M3, 15.3 inch Liquid Retina',              '${IMG_BASE}/products/laptop/1711080787179-apple-02.png',   'Dung lượng', 'Màu', true),
        (11, 9,  2, 'Lenovo ThinkPad X1 Carbon',       'lenovo-thinkpad-x1-carbon',       'ThinkPad X1 Carbon Gen 12, Core Ultra 7',                   '${IMG_BASE}/products/laptop/1711079073759-lenovo-01.png',      NULL,          NULL, true),
        (12, 10, 6, 'Tai nghe AirPods Pro 2',          'tai-nghe-airpods-pro-2',          'AirPods Pro 2 USB-C, chống ồn chủ động',                   '${IMG_BASE}/products/seed/p12.jpg',    NULL,          NULL, true),
        (13, 10, 6, 'Sạc nhanh 65W GaN',              'sac-nhanh-65w-gan',              'Sạc nhanh 65W GaN, 3 cổng, gọn nhẹ',                       '${IMG_BASE}/products/seed/p13.jpg',      NULL,          NULL, true),
        (14, 11, 3, 'Bàn làm việc gỗ tự nhiên',       'ban-lam-viec-go-tu-nhien',       'Bàn làm việc gỗ sồi, kích thước 120x60cm',                 '${IMG_BASE}/products/seed/p14.jpg',     'Màu sắc',    NULL, true),
        (15, 11, 3, 'Ghế công thái học',               'ghe-cong-thai-hoc',               'Ghế ergonomic có tựa đầu, tay vịn điều chỉnh',             '${IMG_BASE}/products/seed/p15.jpg',    'Màu sắc',    NULL, true),
        (16, 12, 3, 'Nồi chiên không dầu 5L',         'noi-chien-khong-dau-5l',         'Air fryer 5 lít, 8 chế độ nấu, màn hình cảm ứng',         '${IMG_BASE}/products/seed/p16.jpg',         NULL,          NULL, true),
        (17, 12, 3, 'Bộ dao nhà bếp 6 món',           'bo-dao-nha-bep-6-mon',           'Bộ dao thép không gỉ kèm block gỗ',                        '${IMG_BASE}/products/seed/p17.jpg',            NULL,          NULL, true),
        (18, 13, 4, 'Đắc Nhân Tâm',                   'dac-nhan-tam',                   'Dale Carnegie - Nghệ thuật ứng xử và giao tiếp',           '${IMG_BASE}/products/seed/p18.jpg',     NULL,          NULL, true),
        (19, 13, 4, 'Atomic Habits',                   'atomic-habits',                   'James Clear - Thay đổi tí hon, hiệu quả bất ngờ',          '${IMG_BASE}/products/seed/p19.jpg',    NULL,          NULL, true),
        (20, 14, 4, 'Nhà Giả Kim',                    'nha-gia-kim',                    'Paulo Coelho - Tiểu thuyết triết lý nổi tiếng thế giới',   '${IMG_BASE}/products/seed/p20.jpg',      NULL,          NULL, true);
    `);
    console.log('  + products: 20 rows');

    // ── Product Variants (46) ──
    await qr.query(`
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        (1,  1, 'ATB-DEN-M',   'Đen',   'M',  250000, 199000, 50),
        (2,  1, 'ATB-DEN-L',   'Đen',   'L',  250000, 199000, 40),
        (3,  1, 'ATB-DEN-XL',  'Đen',   'XL', 250000, 199000, 30),
        (4,  1, 'ATB-TRANG-M', 'Trắng', 'M',  250000, NULL,   45),
        (5,  1, 'ATB-TRANG-L', 'Trắng', 'L',  250000, NULL,   35),
        (6,  2, 'ATO-DEN-L',   'Đen',   'L',  290000, 249000, 30),
        (7,  2, 'ATO-DEN-XL',  'Đen',   'XL', 290000, 249000, 25),
        (8,  2, 'ATO-XAM-L',   'Xám',   'L',  290000, NULL,   35),
        (9,  2, 'ATO-XAM-XL',  'Xám',   'XL', 290000, NULL,   20),
        (10, 3, 'ASM-TRANG-M', 'Trắng', 'M',  450000, 389000, 20),
        (11, 3, 'ASM-TRANG-L', 'Trắng', 'L',  450000, 389000, 15),
        (12, 3, 'ASM-XANH-M',  'Xanh',  'M',  450000, NULL,   25),
        (13, 3, 'ASM-XANH-L',  'Xanh',  'L',  450000, NULL,   20),
        (14, 4, 'QJS-XANH-30', 'Xanh đậm', '30', 550000, 479000, 20),
        (15, 4, 'QJS-XANH-32', 'Xanh đậm', '32', 550000, 479000, 25),
        (16, 4, 'QJS-DEN-30',  'Đen',       '30', 550000, NULL,   15),
        (17, 4, 'QJS-DEN-32',  'Đen',       '32', 550000, NULL,   20),
        (18, 5, 'QKK-BE-30',   'Be',    '30', 420000, NULL,   30),
        (19, 5, 'QKK-BE-32',   'Be',    '32', 420000, NULL,   25),
        (20, 5, 'QKK-DEN-30',  'Đen',   '30', 420000, 369000, 20),
        (21, 6, 'GST-40',      '40',    NULL, 890000, 790000, 15),
        (22, 6, 'GST-41',      '41',    NULL, 890000, 790000, 20),
        (23, 6, 'GST-42',      '42',    NULL, 890000, 790000, 18),
        (24, 6, 'GST-43',      '43',    NULL, 890000, 790000, 10),
        (25, 7, 'DQN-40',      '40',    NULL, 250000, NULL,   40),
        (26, 7, 'DQN-41',      '41',    NULL, 250000, NULL,   35),
        (27, 7, 'DQN-42',      '42',    NULL, 250000, NULL,   30),
        (28, 8, 'IP15PM-256-TT',  '256GB', 'Titan tự nhiên', 34990000, 32990000, 10),
        (29, 8, 'IP15PM-256-XD',  '256GB', 'Xanh dương',     34990000, 32990000, 8),
        (30, 8, 'IP15PM-512-TT',  '512GB', 'Titan tự nhiên', 40990000, NULL,      5),
        (31, 9, 'SS24U-256-DEN',  '256GB', 'Đen',    31990000, 29990000, 12),
        (32, 9, 'SS24U-512-TIM',  '512GB', 'Tím',    37990000, NULL,      6),
        (33, 10, 'MBA-M3-256-BH',  '256GB', 'Bạc',       27990000, 26490000, 8),
        (34, 10, 'MBA-M3-512-XD',  '512GB', 'Xanh đêm',  33990000, NULL,     5),
        (35, 11, 'TP-X1-C12',      NULL,     NULL, 35990000, 33490000, 4),
        (36, 12, 'APP2-USBC',      NULL,     NULL, 5990000,  5490000,  25),
        (37, 13, 'SN65W-GAN',      NULL,     NULL, 650000,   549000,   40),
        (38, 14, 'BLV-SOI',        'Gỗ sồi',    NULL, 3500000, 2990000, 8),
        (39, 14, 'BLV-OC',         'Gỗ óc chó', NULL, 4500000, NULL,    5),
        (40, 15, 'GCT-DEN',        'Đen',   NULL, 4990000, 4290000, 6),
        (41, 15, 'GCT-XAM',        'Xám',   NULL, 4990000, NULL,    8),
        (42, 16, 'AF-5L',          NULL,     NULL, 1890000, 1590000, 15),
        (43, 17, 'BD-6MON',        NULL,     NULL, 890000,  749000,  20),
        (44, 18, 'DNT-01',         NULL,     NULL, 86000,   69000,   100),
        (45, 19, 'AH-01',          NULL,     NULL, 150000,  119000,  80),
        (46, 20, 'NGK-01',         NULL,     NULL, 69000,   55000,   120);
    `);
    console.log('  + product_variants: 46 rows');

    // ── Product Images (45) — includes variant-specific images for color products ──
    await qr.query(`
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        -- Product 1: Áo thun basic — shared + Đen + Trắng
        (1,  1,  '${IMG_BASE}/products/seed/p1.jpg',       0, NULL),
        (2,  1,  '${IMG_BASE}/products/seed/p1.jpg',   0, 'Đen'),
        (3,  1,  '${IMG_BASE}/products/seed/p1.jpg',   1, 'Đen'),
        (4,  1,  '${IMG_BASE}/products/seed/p1.jpg', 0, 'Trắng'),
        (5,  1,  '${IMG_BASE}/products/seed/p1.jpg', 1, 'Trắng'),
        -- Product 2: Áo thun oversize — Đen + Xám (no shared, tests variant-only)
        (6,  2,  '${IMG_BASE}/products/seed/p2.jpg',     0, 'Đen'),
        (7,  2,  '${IMG_BASE}/products/seed/p2.jpg',     1, 'Đen'),
        (8,  2,  '${IMG_BASE}/products/seed/p2.jpg',     0, 'Xám'),
        (9,  2,  '${IMG_BASE}/products/seed/p2.jpg',     1, 'Xám'),
        -- Product 3: Áo sơ mi Oxford — shared + Trắng + Xanh
        (10, 3,  '${IMG_BASE}/products/seed/p3.jpg',       0, NULL),
        (11, 3,  '${IMG_BASE}/products/seed/p3.jpg',        0, 'Trắng'),
        (12, 3,  '${IMG_BASE}/products/seed/p3.jpg',         0, 'Xanh'),
        -- Product 4-5: Quần — shared only (tests fallback)
        (13, 4,  '${IMG_BASE}/products/seed/p4.jpg',  0, NULL),
        (14, 4,  '${IMG_BASE}/products/seed/p4.jpg',  1, NULL),
        (15, 5,  '${IMG_BASE}/products/seed/p5.jpg',       0, NULL),
        (16, 5,  '${IMG_BASE}/products/seed/p5.jpg',       1, NULL),
        -- Product 6-7: Giày dép — no color variants, all shared
        (17, 6,  '${IMG_BASE}/products/seed/p6.jpg',      0, NULL),
        (18, 6,  '${IMG_BASE}/products/seed/p6.jpg',      1, NULL),
        (19, 7,  '${IMG_BASE}/products/seed/p7.jpg',     0, NULL),
        (20, 7,  '${IMG_BASE}/products/seed/p7.jpg',     1, NULL),
        -- Product 8-13: Electronics — all shared
        (21, 8,  '${IMG_BASE}/products/seed/p8.jpg',   0, NULL),
        (22, 8,  '${IMG_BASE}/products/seed/p8.jpg',   1, NULL),
        (23, 9,  '${IMG_BASE}/products/seed/p9.jpg',        0, NULL),
        (24, 9,  '${IMG_BASE}/products/seed/p9.jpg',        1, NULL),
        (25, 10, '${IMG_BASE}/products/laptop/1711080787179-apple-02.png',     0, NULL),
        (26, 10, '${IMG_BASE}/products/laptop/1711080787179-apple-02.png',     1, NULL),
        (27, 11, '${IMG_BASE}/products/laptop/1711079073759-lenovo-01.png',        0, NULL),
        (28, 11, '${IMG_BASE}/products/laptop/1711079073759-lenovo-01.png',        1, NULL),
        (29, 12, '${IMG_BASE}/products/seed/p12.jpg',      0, NULL),
        (30, 12, '${IMG_BASE}/products/seed/p12.jpg',      1, NULL),
        (31, 13, '${IMG_BASE}/products/seed/p13.jpg',        0, NULL),
        -- Product 14: Bàn làm việc — Gỗ sồi + Gỗ óc chó
        (32, 14, '${IMG_BASE}/products/seed/p14.jpg',   0, 'Gỗ sồi'),
        (33, 14, '${IMG_BASE}/products/seed/p14.jpg',0, 'Gỗ óc chó'),
        -- Product 15: Ghế — Đen + Xám
        (34, 15, '${IMG_BASE}/products/seed/p15.jpg',  0, 'Đen'),
        (35, 15, '${IMG_BASE}/products/seed/p15.jpg',  0, 'Xám'),
        -- Product 16-20: No variants, all shared
        (36, 16, '${IMG_BASE}/products/seed/p16.jpg',          0, NULL),
        (37, 16, '${IMG_BASE}/products/seed/p16.jpg',          1, NULL),
        (38, 17, '${IMG_BASE}/products/seed/p17.jpg',             0, NULL),
        (39, 18, '${IMG_BASE}/products/seed/p18.jpg',       0, NULL),
        (40, 19, '${IMG_BASE}/products/seed/p19.jpg',      0, NULL),
        (41, 20, '${IMG_BASE}/products/seed/p20.jpg',        0, NULL);
    `);
    console.log('  + product_images: 41 rows');

    // ══════════════════════════════════════════════════════════════
    // ── NEW SEED DATA (based on uploaded product images) ──────────
    // ══════════════════════════════════════════════════════════════

    // ── New Categories (2) ──
    await qr.query(`
      INSERT INTO categories (id, parent_id, name, slug) VALUES
        (17, 5, 'Áo khoác',              'ao-khoac'),
        (18, 1, 'Phụ kiện thời trang',   'phu-kien-thoi-trang'),
        -- Catch-all leaves: a valid fallback when no specific sub-category fits.
        -- One per root + a standalone root "Khác" (itself a leaf, so it's
        -- directly selectable under the leaf-only product picker).
        (19, 1,    'Khác', 'thoi-trang-khac'),
        (20, 2,    'Khác', 'dien-tu-khac'),
        (21, 3,    'Khác', 'nha-cua-khac'),
        (22, 4,    'Khác', 'sach-khac'),
        (23, NULL, 'Khác', 'khac');
    `);
    console.log('  + categories: +7 rows (17-23)');

    // ── New Products (30) ──
    await qr.query(`
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (21, 17, 1, 'Áo khoác Non Branded 04',     'ao-khoac-non-branded-04',     'Áo khoác gió có nón, chất liệu nhẹ chống nước',
          '${IMG_BASE}/products/ao/ao-khoac-non-branded-04-den-1174884707.webp', 'Màu sắc', 'Kích thước', true),
        (22, 17, 1, 'Áo khoác The Beginner M006',  'ao-khoac-the-beginner-m006',  'Áo khoác thể thao The Beginner, form slim fit, vải gió cao cấp',
          '${IMG_BASE}/products/ao/ao-khoac-the-beginner-m006-den-1177437004.webp', 'Màu sắc', 'Kích thước', true),
        (23, 16, 1, 'Áo sơ mi Non Branded 19',     'ao-so-mi-non-branded-19',     'Áo sơ mi tay ngắn form regular, vải mềm thoáng mát',
          '${IMG_BASE}/products/ao/ao-so-mi-non-branded-19-tr-ng-1174884380.webp', 'Kích thước', NULL, true),
        (24, 16, 1, 'Áo sơ mi Non Branded 33',     'ao-so-mi-non-branded-33',     'Áo sơ mi tay ngắn cổ bẻ, phong cách lịch lãm',
          '${IMG_BASE}/products/ao/ao-so-mi-non-branded-33-xanh-d-ng-1174884119.webp', 'Màu sắc', 'Kích thước', true),
        (25, 16, 1, 'Áo sơ mi Seventy Seven 22',   'ao-so-mi-seventy-seven-22',   'Áo sơ mi phối tay contrast, chất liệu cotton pha',
          '${IMG_BASE}/products/ao/ao-so-mi-seventy-seven-22-be-1174882837.webp', 'Màu sắc', 'Kích thước', true),
        (26, 15, 1, 'Áo thun Non Branded 01',      'ao-thun-non-branded-01',      'Áo thun cổ tròn basic, chất cotton thoáng mát',
          '${IMG_BASE}/products/ao/ao-thun-non-branded-01-den-1174882387.webp', 'Kích thước', NULL, true),
        (27, 15, 1, 'Áo thun Seventy Seven 04',    'ao-thun-seventy-seven-04',    'Áo thun cổ tròn viền sọc, form vừa vặn thời trang',
          '${IMG_BASE}/products/ao/ao-thun-seventy-seven-04-tr-ng-1174883207.webp', 'Màu sắc', 'Kích thước', true),
        (28, 15, 1, 'Áo thun Seventy Seven 10',    'ao-thun-seventy-seven-10',    'Áo thun oversize phong cách đường phố, logo metal',
          '${IMG_BASE}/products/ao/ao-thun-seventy-seven-10-den-1174883597.webp', 'Kích thước', NULL, true),
        (29, 15, 1, 'Áo thun Seventy Seven 13',    'ao-thun-seventy-seven-13',    'Áo thun cổ tròn viền sọc raglan, đa dạng màu sắc',
          '${IMG_BASE}/products/ao/ao-thun-seventy-seven-13-be-1174883511.webp', 'Màu sắc', 'Kích thước', true),
        (30, 6,  5, 'Quần jean The Original 28',   'quan-jean-the-original-28',   'Quần jean nam dáng slim, vải denim co giãn thoải mái',
          '${IMG_BASE}/products/quan/quan-jean-the-original-28-xanh-d-ng-1174882630.webp', 'Màu sắc', 'Kích thước', true),
        (31, 6,  5, 'Quần jean The Original M101',  'quan-jean-the-original-m101', 'Quần jean nam dáng rộng, chất liệu denim mềm',
          '${IMG_BASE}/products/quan/quan-jean-the-original-m101-xanh-d-ng-1174882525.webp', 'Kích thước', NULL, true),
        (32, 6,  5, 'Quần short Non Branded 05',   'quan-short-non-branded-05',   'Quần short nam thun, lưng chun thoải mái, nhiều màu',
          '${IMG_BASE}/products/quan/quan-short-non-branded-05-be-1174882076.webp', 'Màu sắc', 'Kích thước', true),
        (33, 9,  2, 'ASUS TUF Gaming F15',         'asus-tuf-gaming-f15',         'Laptop gaming ASUS TUF, bàn phím RGB, tản nhiệt hiệu quả',
          '${IMG_BASE}/products/laptop/1711078092373-asus-01.png', NULL, NULL, true),
        (34, 9,  2, 'Dell Inspiron 15 3530',        'dell-inspiron-15-3530',       'Laptop Dell Inspiron 15 inch, mỏng nhẹ cho văn phòng',
          '${IMG_BASE}/products/laptop/1711078452562-dell-01.png', NULL, NULL, true),
        (35, 9,  2, 'Lenovo IdeaPad Gaming 3',     'lenovo-ideapad-gaming-3',     'Laptop gaming Lenovo IdeaPad, hiệu năng mạnh mẽ',
          '${IMG_BASE}/products/laptop/1711079073759-lenovo-01.png', NULL, NULL, true),
        (36, 9,  2, 'ASUS VivoBook X541',           'asus-vivobook-x541',          'Laptop ASUS VivoBook phổ thông, nhẹ nhàng cho học sinh',
          '${IMG_BASE}/products/laptop/1711079496409-asus-02.png', NULL, NULL, true),
        (37, 9,  2, 'MacBook Pro M2 13 inch',       'macbook-pro-m2',              'MacBook Pro chip M2, màn Retina 13.3 inch, hiệu năng chuyên nghiệp',
          '${IMG_BASE}/products/laptop/1711079954090-apple-01.png', NULL, NULL, true),
        (38, 9,  2, 'LG Gram 15 2024',              'lg-gram-15-2024',             'Laptop LG Gram siêu nhẹ, pin trâu, màn hình IPS sắc nét',
          '${IMG_BASE}/products/laptop/1711080386941-lg-01.png', NULL, NULL, true),
        (39, 9,  2, 'MacBook Air M2',               'macbook-air-m2',              'MacBook Air chip M2, thiết kế mỏng nhẹ, Liquid Retina',
          '${IMG_BASE}/products/laptop/1711080787179-apple-02.png', NULL, NULL, true),
        (40, 9,  2, 'Acer Nitro 5 Gaming',          'acer-nitro-5',                'Laptop gaming Acer Nitro, Intel + NVIDIA, hiệu năng cao',
          '${IMG_BASE}/products/laptop/1711080948771-acer-01.png', NULL, NULL, true),
        (41, 9,  2, 'ASUS Vivobook Pro 15 OLED',    'asus-vivobook-pro-15-oled',   'Laptop ASUS Vivobook Pro, màn OLED 15 inch sắc nét',
          '${IMG_BASE}/products/laptop/1711081080930-asus-03.png', NULL, NULL, true),
        (42, 9,  2, 'Dell Vostro 15 3530',          'dell-vostro-15-3530',         'Laptop Dell Vostro doanh nghiệp, Core i5, bền bỉ tin cậy',
          '${IMG_BASE}/products/laptop/1711081278418-dell-02.png', NULL, NULL, true),
        (43, 18, 6, 'Nón lưỡi trai Non Branded 12', 'non-luoi-trai-non-branded-12', 'Nón lưỡi trai thoáng khí, chất liệu nhẹ chống UV',
          '${IMG_BASE}/products/phu-kien/non-non-branded-12-be-1174878916.webp', NULL, NULL, true),
        (44, 18, 6, 'Nón Y2010 02',                 'non-y2010-02',                'Nón bucket đen Y2010, phong cách streetwear',
          '${IMG_BASE}/products/phu-kien/non-y2010-02-den-1174879791.webp', NULL, NULL, true),
        (45, 18, 6, 'Nón Y2010 04',                 'non-y2010-04',                'Nón bucket xanh đen Y2010, chất liệu bền đẹp',
          '${IMG_BASE}/products/phu-kien/non-y2010-04-xanh-den-1174878969.webp', NULL, NULL, true),
        (46, 18, 6, 'Bộ gối thể thao Beginner 87',  'bo-goi-the-thao-beginner-87', 'Bộ đệm bảo vệ đầu gối khi tập gym, chạy bộ',
          '${IMG_BASE}/products/phu-kien/bo-g-i-th-thao-beginner-87-1174879762.webp', NULL, NULL, true),
        (47, 18, 6, 'Dây nịt Y2010 D15',            'day-nit-y2010-d15',           'Dây nịt da đen Y2010, khóa tự động sang trọng',
          '${IMG_BASE}/products/phu-kien/day-n-t-y2010-d15-den-1174880703.webp', NULL, NULL, true),
        (48, 18, 6, 'Túi đeo chéo Y2010 34',        'tui-deo-cheo-y2010-34',       'Túi đeo chéo Y2010 đen, thiết kế tối giản chống nước',
          '${IMG_BASE}/products/phu-kien/tui-deo-y2010-34-den-1174880785.webp', NULL, NULL, true),
        (49, 18, 6, 'Ví da Y2010 02',               'vi-da-y2010-02',              'Ví đứng da Y2010, thiết kế nhỏ gọn nhiều ngăn',
          '${IMG_BASE}/products/phu-kien/vi-y2010-02-den-1174880616.jpg', NULL, NULL, true),
        (50, 18, 6, 'Ví da Y2010 05',               'vi-da-y2010-05',              'Ví ngang da Y2010, kiểu dáng lịch lãm',
          '${IMG_BASE}/products/phu-kien/vi-y2010-05-den-1174880343.webp', NULL, NULL, true);
    `);
    console.log('  + products: +30 rows (21-50)');

    // ── New Product Variants — Fashion (42 variants) ──
    await qr.query(`
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        -- P21: Áo khoác Non Branded 04 (4 colors × M,L)
        (47, 21, 'AK-NB04-DEN-M',  'Đen',       'M', 550000, 479000, 30),
        (48, 21, 'AK-NB04-DEN-L',  'Đen',       'L', 550000, 479000, 25),
        (49, 21, 'AK-NB04-HONG-M', 'Hồng',      'M', 550000, 479000, 20),
        (50, 21, 'AK-NB04-HONG-L', 'Hồng',      'L', 550000, 479000, 15),
        (51, 21, 'AK-NB04-XAM-M',  'Xám đậm',   'M', 550000, NULL,   25),
        (52, 21, 'AK-NB04-XAM-L',  'Xám đậm',   'L', 550000, NULL,   20),
        (53, 21, 'AK-NB04-XR-M',   'Xanh rêu',  'M', 550000, NULL,   20),
        (54, 21, 'AK-NB04-XR-L',   'Xanh rêu',  'L', 550000, NULL,   15),
        -- P22: Áo khoác The Beginner M006 (2 colors × M,L)
        (55, 22, 'AK-TBM6-DEN-M',  'Đen',       'M', 650000, 569000, 20),
        (56, 22, 'AK-TBM6-DEN-L',  'Đen',       'L', 650000, 569000, 15),
        (57, 22, 'AK-TBM6-XR-M',   'Xanh rêu',  'M', 650000, NULL,   18),
        (58, 22, 'AK-TBM6-XR-L',   'Xanh rêu',  'L', 650000, NULL,   12),
        -- P23: Áo sơ mi Non Branded 19 (size only)
        (59, 23, 'ASM-NB19-M',     'M',  NULL, 380000, 329000, 25),
        (60, 23, 'ASM-NB19-L',     'L',  NULL, 380000, 329000, 20),
        (61, 23, 'ASM-NB19-XL',    'XL', NULL, 380000, NULL,   15),
        -- P24: Áo sơ mi Non Branded 33 (3 colors × M,L)
        (62, 24, 'ASM-NB33-DEN-M', 'Đen',        'M', 420000, 369000, 20),
        (63, 24, 'ASM-NB33-DEN-L', 'Đen',        'L', 420000, 369000, 15),
        (64, 24, 'ASM-NB33-TR-M',  'Trắng',      'M', 420000, NULL,   25),
        (65, 24, 'ASM-NB33-TR-L',  'Trắng',      'L', 420000, NULL,   20),
        (66, 24, 'ASM-NB33-XD-M',  'Xanh dương', 'M', 420000, NULL,   20),
        (67, 24, 'ASM-NB33-XD-L',  'Xanh dương', 'L', 420000, NULL,   15),
        -- P25: Áo sơ mi Seventy Seven 22 (2 colors × M,L)
        (68, 25, 'ASM-SS22-BE-M',  'Be',  'M', 450000, 389000, 20),
        (69, 25, 'ASM-SS22-BE-L',  'Be',  'L', 450000, 389000, 15),
        (70, 25, 'ASM-SS22-DEN-M', 'Đen', 'M', 450000, NULL,   18),
        (71, 25, 'ASM-SS22-DEN-L', 'Đen', 'L', 450000, NULL,   12),
        -- P26: Áo thun Non Branded 01 (size only)
        (72, 26, 'AT-NB01-M',      'M',  NULL, 250000, 199000, 40),
        (73, 26, 'AT-NB01-L',      'L',  NULL, 250000, 199000, 35),
        (74, 26, 'AT-NB01-XL',     'XL', NULL, 250000, NULL,   25),
        -- P27: Áo thun Seventy Seven 04 (2 colors × M,L)
        (75, 27, 'AT-SS04-TR-M',   'Trắng',    'M', 320000, 269000, 25),
        (76, 27, 'AT-SS04-TR-L',   'Trắng',    'L', 320000, 269000, 20),
        (77, 27, 'AT-SS04-XG-M',   'Xám ghi',  'M', 320000, NULL,   22),
        (78, 27, 'AT-SS04-XG-L',   'Xám ghi',  'L', 320000, NULL,   18),
        -- P28: Áo thun Seventy Seven 10 (size only)
        (79, 28, 'AT-SS10-M',      'M', NULL, 290000, 249000, 30),
        (80, 28, 'AT-SS10-L',      'L', NULL, 290000, 249000, 25),
        -- P29: Áo thun Seventy Seven 13 (4 colors × M,L)
        (81, 29, 'AT-SS13-BE-M',   'Be',    'M', 280000, 239000, 25),
        (82, 29, 'AT-SS13-BE-L',   'Be',    'L', 280000, 239000, 20),
        (83, 29, 'AT-SS13-DEN-M',  'Đen',   'M', 280000, NULL,   30),
        (84, 29, 'AT-SS13-DEN-L',  'Đen',   'L', 280000, NULL,   25),
        (85, 29, 'AT-SS13-TR-M',   'Trắng', 'M', 280000, NULL,   20),
        (86, 29, 'AT-SS13-TR-L',   'Trắng', 'L', 280000, NULL,   15),
        (87, 29, 'AT-SS13-XAM-M',  'Xám',   'M', 280000, NULL,   22),
        (88, 29, 'AT-SS13-XAM-L',  'Xám',   'L', 280000, NULL,   18);
    `);
    console.log('  + product_variants: +42 rows (47-88) — fashion');

    // ── New Product Variants — Pants, Laptops, Accessories (35 variants) ──
    await qr.query(`
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        -- P30: Quần jean The Original 28 (3 colors × 30,32)
        (89,  30, 'QJ-TO28-DEN-30',  'Đen',        '30', 520000, 459000, 20),
        (90,  30, 'QJ-TO28-DEN-32',  'Đen',        '32', 520000, 459000, 18),
        (91,  30, 'QJ-TO28-XDM-30',  'Xanh đậm',   '30', 520000, NULL,   22),
        (92,  30, 'QJ-TO28-XDM-32',  'Xanh đậm',   '32', 520000, NULL,   20),
        (93,  30, 'QJ-TO28-XDG-30',  'Xanh dương',  '30', 520000, NULL,   18),
        (94,  30, 'QJ-TO28-XDG-32',  'Xanh dương',  '32', 520000, NULL,   15),
        -- P31: Quần jean The Original M101 (size only)
        (95,  31, 'QJ-TOM101-29',    '29', NULL, 480000, 419000, 15),
        (96,  31, 'QJ-TOM101-30',    '30', NULL, 480000, 419000, 20),
        (97,  31, 'QJ-TOM101-32',    '32', NULL, 480000, NULL,   18),
        -- P32: Quần short Non Branded 05 (4 colors × M,L)
        (98,  32, 'QS-NB05-BE-M',    'Be',       'M', 320000, 269000, 25),
        (99,  32, 'QS-NB05-BE-L',    'Be',       'L', 320000, 269000, 20),
        (100, 32, 'QS-NB05-DEN-M',   'Đen',      'M', 320000, NULL,   30),
        (101, 32, 'QS-NB05-DEN-L',   'Đen',      'L', 320000, NULL,   25),
        (102, 32, 'QS-NB05-NR-M',    'Nâu rêu',  'M', 320000, NULL,   20),
        (103, 32, 'QS-NB05-NR-L',    'Nâu rêu',  'L', 320000, NULL,   15),
        (104, 32, 'QS-NB05-XD-M',    'Xanh đen', 'M', 320000, NULL,   22),
        (105, 32, 'QS-NB05-XD-L',    'Xanh đen', 'L', 320000, NULL,   18),
        -- P33-P42: Laptops (1 variant each)
        (106, 33, 'ASUS-TUF-F15',    NULL, NULL, 18990000, 16990000, 8),
        (107, 34, 'DELL-INS-3530',   NULL, NULL, 15990000, 14490000, 10),
        (108, 35, 'LNV-IPG3',        NULL, NULL, 19990000, 17990000, 6),
        (109, 36, 'ASUS-VB-X541',    NULL, NULL,  9990000,  8490000, 12),
        (110, 37, 'MBP-M2-13',       NULL, NULL, 29990000, 27990000, 5),
        (111, 38, 'LG-GRAM-15',      NULL, NULL, 25990000, 23990000, 7),
        (112, 39, 'MBA-M2-13',       NULL, NULL, 24990000, 22990000, 8),
        (113, 40, 'ACER-NITRO5',     NULL, NULL, 22990000, 20990000, 6),
        (114, 41, 'ASUS-VBP15',      NULL, NULL, 21990000, 19990000, 7),
        (115, 42, 'DELL-VOS-3530',   NULL, NULL, 14990000, 13490000, 10),
        -- P43-P50: Phụ kiện thời trang (1 variant each)
        (116, 43, 'NON-NB12',        NULL, NULL, 280000, 239000, 35),
        (117, 44, 'NON-Y2010-02',    NULL, NULL, 320000, 269000, 30),
        (118, 45, 'NON-Y2010-04',    NULL, NULL, 320000, NULL,   25),
        (119, 46, 'GTTB-BG87',       NULL, NULL, 189000, 149000, 40),
        (120, 47, 'DNIT-Y2010-D15',  NULL, NULL, 290000, 249000, 25),
        (121, 48, 'TDC-Y2010-34',    NULL, NULL, 520000, 449000, 15),
        (122, 49, 'VDA-Y2010-02',    NULL, NULL, 390000, 329000, 20),
        (123, 50, 'VDA-Y2010-05',    NULL, NULL, 450000, 379000, 18);
    `);
    console.log(
      '  + product_variants: +35 rows (89-123) — pants/laptops/accessories',
    );

    // ── New Product Images (52) ──
    await qr.query(`
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        -- P21: Áo khoác NB04 (4 color images)
        (42, 21, '${IMG_BASE}/products/ao/ao-khoac-non-branded-04-den-1174884707.webp',      0, 'Đen'),
        (43, 21, '${IMG_BASE}/products/ao/ao-khoac-non-branded-04-h-ng-1174884689.webp',     0, 'Hồng'),
        (44, 21, '${IMG_BASE}/products/ao/ao-khoac-non-branded-04-xam-d-m-1174884510.webp',  0, 'Xám đậm'),
        (45, 21, '${IMG_BASE}/products/ao/ao-khoac-non-branded-04-xanh-reu-1174884672.webp', 0, 'Xanh rêu'),
        -- P22: Áo khoác TB M006 (2 color images)
        (46, 22, '${IMG_BASE}/products/ao/ao-khoac-the-beginner-m006-den-1177437004.webp',     0, 'Đen'),
        (47, 22, '${IMG_BASE}/products/ao/ao-khoac-the-beginner-m006-xanh-reu-1177436985.webp',0, 'Xanh rêu'),
        -- P23: Áo sơ mi NB19 (1 shared)
        (48, 23, '${IMG_BASE}/products/ao/ao-so-mi-non-branded-19-tr-ng-1174884380.webp', 0, NULL),
        -- P24: Áo sơ mi NB33 (3 color images)
        (49, 24, '${IMG_BASE}/products/ao/ao-so-mi-non-branded-33-den-1174884163.webp',      0, 'Đen'),
        (50, 24, '${IMG_BASE}/products/ao/ao-so-mi-non-branded-33-tr-ng-1174884128.webp',    0, 'Trắng'),
        (51, 24, '${IMG_BASE}/products/ao/ao-so-mi-non-branded-33-xanh-d-ng-1174884119.webp',0, 'Xanh dương'),
        -- P25: Áo sơ mi SS22 (2 color images)
        (52, 25, '${IMG_BASE}/products/ao/ao-so-mi-seventy-seven-22-be-1174882837.webp',  0, 'Be'),
        (53, 25, '${IMG_BASE}/products/ao/ao-so-mi-seventy-seven-22-den-1174882869.webp', 0, 'Đen'),
        -- P26: Áo thun NB01 (1 shared)
        (54, 26, '${IMG_BASE}/products/ao/ao-thun-non-branded-01-den-1174882387.webp', 0, NULL),
        -- P27: Áo thun SS04 (2 color + 4 shared detail/size chart)
        (55, 27, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-04-tr-ng-1174883207.webp',        0, 'Trắng'),
        (56, 27, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-04-xam-ghi-1174883153.webp',     0, 'Xám ghi'),
        (57, 27, '${IMG_BASE}/products/ao-detail/ao-thun-seventy-seven-04-h-ng-1174883166.webp', 0, NULL),
        (58, 27, '${IMG_BASE}/products/ao-detail/ao-thun-seventy-seven-04-h-ng-1174883170.webp', 1, NULL),
        (59, 27, '${IMG_BASE}/products/ao-detail/size-ao-1.webp', 2, NULL),
        (60, 27, '${IMG_BASE}/products/ao-detail/size-ao-2.webp', 3, NULL),
        -- P28: Áo thun SS10 (1 shared)
        (61, 28, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-10-den-1174883597.webp', 0, NULL),
        -- P29: Áo thun SS13 (4 color images)
        (62, 29, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-13-be-1174883511.webp',  0, 'Be'),
        (63, 29, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-13-den-1174883530.webp', 0, 'Đen'),
        (64, 29, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-13-tr-ng-1174883539.webp',0, 'Trắng'),
        (65, 29, '${IMG_BASE}/products/ao/ao-thun-seventy-seven-13-xam-1174883483.webp', 0, 'Xám'),
        -- P30: Quần jean TO28 (3 color images)
        (66, 30, '${IMG_BASE}/products/quan/quan-jean-the-original-28-den-1174882647.webp',        0, 'Đen'),
        (67, 30, '${IMG_BASE}/products/quan/quan-jean-the-original-28-xanh-d-m-1-1174882642.webp', 0, 'Xanh đậm'),
        (68, 30, '${IMG_BASE}/products/quan/quan-jean-the-original-28-xanh-d-ng-1174882630.webp',  0, 'Xanh dương'),
        -- P31: Quần jean TO M101 (1 shared)
        (69, 31, '${IMG_BASE}/products/quan/quan-jean-the-original-m101-xanh-d-ng-1174882525.webp', 0, NULL),
        -- P32: Quần short NB05 (4 color + 2 shared detail)
        (70, 32, '${IMG_BASE}/products/quan/quan-short-non-branded-05-be-1174882076.webp',      0, 'Be'),
        (71, 32, '${IMG_BASE}/products/quan/quan-short-non-branded-05-den-1174882099.webp',     0, 'Đen'),
        (72, 32, '${IMG_BASE}/products/quan/quan-short-non-branded-05-nau-reu-1174882113.webp', 0, 'Nâu rêu'),
        (73, 32, '${IMG_BASE}/products/quan/quan-short-non-branded-05-xanh-den-1174882061.webp',0, 'Xanh đen'),
        (74, 32, '${IMG_BASE}/products/quan-detail/qu-n-short-non-branded-05-den-1174882100.webp', 1, NULL),
        (75, 32, '${IMG_BASE}/products/quan-detail/QU._SHORT.webp', 2, NULL),
        -- P33-P42: Laptops (1 each)
        (76, 33, '${IMG_BASE}/products/laptop/1711078092373-asus-01.png',  0, NULL),
        (77, 34, '${IMG_BASE}/products/laptop/1711078452562-dell-01.png',  0, NULL),
        (78, 35, '${IMG_BASE}/products/laptop/1711079073759-lenovo-01.png',0, NULL),
        (79, 36, '${IMG_BASE}/products/laptop/1711079496409-asus-02.png',  0, NULL),
        (80, 37, '${IMG_BASE}/products/laptop/1711079954090-apple-01.png', 0, NULL),
        (81, 38, '${IMG_BASE}/products/laptop/1711080386941-lg-01.png',    0, NULL),
        (82, 39, '${IMG_BASE}/products/laptop/1711080787179-apple-02.png', 0, NULL),
        (83, 40, '${IMG_BASE}/products/laptop/1711080948771-acer-01.png',  0, NULL),
        (84, 41, '${IMG_BASE}/products/laptop/1711081080930-asus-03.png',  0, NULL),
        (85, 42, '${IMG_BASE}/products/laptop/1711081278418-dell-02.png',  0, NULL),
        -- P43-P50: Phụ kiện thời trang (1 each)
        (86, 43, '${IMG_BASE}/products/phu-kien/non-non-branded-12-be-1174878916.webp',     0, NULL),
        (87, 44, '${IMG_BASE}/products/phu-kien/non-y2010-02-den-1174879791.webp',          0, NULL),
        (88, 45, '${IMG_BASE}/products/phu-kien/non-y2010-04-xanh-den-1174878969.webp',     0, NULL),
        (89, 46, '${IMG_BASE}/products/phu-kien/bo-g-i-th-thao-beginner-87-1174879762.webp',0, NULL),
        (90, 47, '${IMG_BASE}/products/phu-kien/day-n-t-y2010-d15-den-1174880703.webp',     0, NULL),
        (91, 48, '${IMG_BASE}/products/phu-kien/tui-deo-y2010-34-den-1174880785.webp',      0, NULL),
        (92, 49, '${IMG_BASE}/products/phu-kien/vi-y2010-02-den-1174880616.jpg',             0, NULL),
        (93, 50, '${IMG_BASE}/products/phu-kien/vi-y2010-05-den-1174880343.webp',            0, NULL);
    `);
    console.log('  + product_images: +52 rows (42-93)');

    // ══════════════════════════════════════════════════════════════
    // ── EXTRA SEED DATA — more products across multiple shops ──────
    //    (curated Unsplash images downloaded to ${IMG_BASE}/products/seed)
    // ══════════════════════════════════════════════════════════════

    // ── Extra Products (18) — shops 2,3,4,6,7 ──
    // Shop 4 Books (51-56), Shop 3 Home (57-60), Shop 7 Shoes (61-65),
    // Shop 2 Electronics (66), Shop 6 Accessories (67-68)
    await qr.query(`
      INSERT INTO products (id, category_id, shop_id, name, slug, description, thumbnail_url, option1_label, option2_label, is_active) VALUES
        (51, 13, 4, 'Tôi Tài Giỏi, Bạn Cũng Thế', 'toi-tai-gioi-ban-cung-the', 'Adam Khoo - Bí quyết học tập và thành công',        '${IMG_BASE}/products/seed/p51.jpg', NULL, NULL, true),
        (52, 13, 4, 'Cà Phê Cùng Tony',           'ca-phe-cung-tony',           'Tony Buổi Sáng - Góc nhìn khởi nghiệp và cuộc sống', '${IMG_BASE}/products/seed/p52.jpg', NULL, NULL, true),
        (53, 14, 4, 'Muôn Kiếp Nhân Sinh',        'muon-kiep-nhan-sinh',        'Nguyên Phong - Tiểu thuyết về luân hồi và nhân quả', '${IMG_BASE}/products/seed/p53.jpg', NULL, NULL, true),
        (54, 13, 4, 'Tuổi Trẻ Đáng Giá Bao Nhiêu', 'tuoi-tre-dang-gia-bao-nhieu', 'Rosie Nguyễn - Sách kỹ năng cho người trẻ',         '${IMG_BASE}/products/seed/p54.jpg', NULL, NULL, true),
        (55, 14, 4, 'Hoàng Tử Bé',                'hoang-tu-be',                'Antoine de Saint-Exupéry - Kiệt tác văn học thiếu nhi', '${IMG_BASE}/products/seed/p55.jpg', NULL, NULL, true),
        (56, 13, 4, 'Sapiens: Lược Sử Loài Người', 'sapiens-luoc-su-loai-nguoi', 'Yuval Noah Harari - Lịch sử tiến hóa loài người',   '${IMG_BASE}/products/seed/p56.jpg', NULL, NULL, true),
        (57, 11, 3, 'Ghế Sofa Da 3 Chỗ',          'ghe-sofa-da-3-cho',          'Sofa da PU cao cấp, khung gỗ tự nhiên, 3 chỗ ngồi',  '${IMG_BASE}/products/seed/p57.jpg', NULL, NULL, true),
        (58, 11, 3, 'Đèn Bàn LED Chống Cận',      'den-ban-led-chong-can',      'Đèn bàn LED bảo vệ mắt, 3 chế độ sáng, cắm USB',     '${IMG_BASE}/products/seed/p58.jpg', NULL, NULL, true),
        (59, 11, 3, 'Kệ Sách Gỗ 5 Tầng',          'ke-sach-go-5-tang',          'Kệ sách gỗ tự nhiên 5 tầng, chắc chắn, dễ lắp ráp',  '${IMG_BASE}/products/seed/p59.jpg', NULL, NULL, true),
        (60, 12, 3, 'Bộ Nồi Inox 5 Món',          'bo-noi-inox-5-mon',          'Bộ nồi inox 304 cao cấp 5 món, dùng mọi loại bếp',   '${IMG_BASE}/products/seed/p60.jpg', NULL, NULL, true),
        (61, 7,  7, 'Giày Chạy Bộ Nam',           'giay-chay-bo-nam',           'Giày chạy bộ đế êm, thoáng khí, hỗ trợ vận động',    '${IMG_BASE}/products/seed/p61.jpg', 'Kích thước', NULL, true),
        (62, 7,  7, 'Giày Sneaker Cổ Điển',       'giay-sneaker-co-dien',       'Giày sneaker phong cách cổ điển, dễ phối đồ',        '${IMG_BASE}/products/seed/p62.jpg', 'Kích thước', NULL, true),
        (63, 7,  7, 'Giày Sneaker Cao Cổ',        'giay-sneaker-cao-co',        'Giày sneaker cao cổ năng động, cá tính',             '${IMG_BASE}/products/seed/p63.jpg', 'Kích thước', NULL, true),
        (64, 7,  7, 'Sandal Quai Hậu Nam',        'sandal-quai-hau-nam',        'Sandal quai hậu chắc chắn, đế chống trơn',          '${IMG_BASE}/products/seed/p64.jpg', 'Kích thước', NULL, true),
        (65, 7,  7, 'Dép Lê Nam',                 'dep-le-nam',                 'Dép lê nam êm nhẹ, phù hợp đi trong nhà và dạo phố', '${IMG_BASE}/products/seed/p65.jpg', 'Kích thước', NULL, true),
        (66, 8,  2, 'Xiaomi Redmi Note 13',       'xiaomi-redmi-note-13',       'Xiaomi Redmi Note 13, màn AMOLED, pin 5000mAh',     '${IMG_BASE}/products/seed/p66.jpg', 'Dung lượng', 'Màu', true),
        (67, 10, 6, 'Tai Nghe Chụp Tai Bluetooth', 'tai-nghe-chup-tai-bluetooth', 'Tai nghe over-ear chống ồn, pin 30 giờ',            '${IMG_BASE}/products/seed/p67.jpg', NULL, NULL, true),
        (68, 10, 6, 'Pin Sạc Dự Phòng 20000mAh',  'pin-sac-du-phong-20000mah',  'Pin dự phòng 20000mAh, sạc nhanh PD 22.5W',          '${IMG_BASE}/products/seed/p68.jpg', NULL, NULL, true);
    `);
    console.log(
      '  + products: +18 rows (51-68) — books/home/shoes/electronics/accessories',
    );

    // ── Extra Product Variants (21) ──
    // Books/home/accessories: 1 variant each. Shoes: size variants. Phone: 2 variants.
    await qr.query(`
      INSERT INTO product_variants (id, product_id, sku, option1, option2, price, sale_price, stock_quantity) VALUES
        (124, 51, 'SACH-TTG',       NULL,     NULL, 110000,  89000,   60),
        (125, 52, 'SACH-TONY',      NULL,     NULL, 95000,   79000,   55),
        (126, 53, 'SACH-MKNS',      NULL,     NULL, 160000,  135000,  40),
        (127, 54, 'SACH-TTDG',      NULL,     NULL, 90000,   75000,   70),
        (128, 55, 'SACH-HTB',       NULL,     NULL, 75000,   59000,   80),
        (129, 56, 'SACH-SAP',       NULL,     NULL, 220000,  179000,  35),
        (130, 57, 'NOI-SOFA3',      NULL,     NULL, 8500000, 7490000, 6),
        (131, 58, 'NOI-DENLED',     NULL,     NULL, 350000,  279000,  40),
        (132, 59, 'NOI-KE5T',       NULL,     NULL, 1200000, 990000,  15),
        (133, 60, 'BEP-NOI5',       NULL,     NULL, 1500000, 1190000, 20),
        (134, 61, 'GIAY-CHAY-41',   '41',    NULL, 950000,  790000,  20),
        (135, 61, 'GIAY-CHAY-42',   '42',    NULL, 950000,  790000,  18),
        (136, 62, 'GIAY-SNCD-42',   '42',    NULL, 850000,  699000,  20),
        (137, 63, 'GIAY-SNCC-42',   '42',    NULL, 990000,  849000,  18),
        (138, 64, 'DEP-SDLQH-42',   '42',    NULL, 320000,  269000,  30),
        (139, 65, 'DEP-LE-42',      '42',    NULL, 180000,  149000,  45),
        (140, 66, 'DT-XIAOMI-128-XL', '128GB', 'Xanh lá', 6490000, 5990000, 20),
        (141, 66, 'DT-XIAOMI-256-DEN', '256GB', 'Đen',    7490000, NULL,    15),
        (142, 67, 'TN-CHUP-BT',     NULL,     NULL, 1200000, 990000,  25),
        (143, 68, 'PIN-20K',        NULL,     NULL, 590000,  490000,  40);
    `);
    console.log('  + product_variants: +20 rows (124-143) — extra products');

    // ── Extra Product Images (18) — one shared image per product ──
    await qr.query(`
      INSERT INTO product_images (id, product_id, image_url, sort_order, variant_option1) VALUES
        (94,  51, '${IMG_BASE}/products/seed/p51.jpg', 0, NULL),
        (95,  52, '${IMG_BASE}/products/seed/p52.jpg', 0, NULL),
        (96,  53, '${IMG_BASE}/products/seed/p53.jpg', 0, NULL),
        (97,  54, '${IMG_BASE}/products/seed/p54.jpg', 0, NULL),
        (98,  55, '${IMG_BASE}/products/seed/p55.jpg', 0, NULL),
        (99,  56, '${IMG_BASE}/products/seed/p56.jpg', 0, NULL),
        (100, 57, '${IMG_BASE}/products/seed/p57.jpg', 0, NULL),
        (101, 58, '${IMG_BASE}/products/seed/p58.jpg', 0, NULL),
        (102, 59, '${IMG_BASE}/products/seed/p59.jpg', 0, NULL),
        (103, 60, '${IMG_BASE}/products/seed/p60.jpg', 0, NULL),
        (104, 61, '${IMG_BASE}/products/seed/p61.jpg', 0, NULL),
        (105, 62, '${IMG_BASE}/products/seed/p62.jpg', 0, NULL),
        (106, 63, '${IMG_BASE}/products/seed/p63.jpg', 0, NULL),
        (107, 64, '${IMG_BASE}/products/seed/p64.jpg', 0, NULL),
        (108, 65, '${IMG_BASE}/products/seed/p65.jpg', 0, NULL),
        (109, 66, '${IMG_BASE}/products/seed/p66.jpg', 0, NULL),
        (110, 67, '${IMG_BASE}/products/seed/p67.jpg', 0, NULL),
        (111, 68, '${IMG_BASE}/products/seed/p68.jpg', 0, NULL);
    `);
    console.log('  + product_images: +18 rows (94-111) — extra products');

    await qr.release();
  },
};
