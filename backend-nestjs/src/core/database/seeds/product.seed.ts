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
        (1,  15, 1, N'Áo thun nam basic cotton',       N'ao-thun-nam-basic-cotton',       N'Áo thun nam chất liệu cotton 100%, thoáng mát',           N'https://picsum.photos/seed/ao-thun-basic/400/400',    N'Màu sắc',    N'Kích thước', 1),
        (2,  15, 1, N'Áo thun nam oversize',            N'ao-thun-nam-oversize',            N'Áo thun form rộng phong cách Hàn Quốc',                    N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc',    N'Kích thước', 1),
        (3,  16, 1, N'Áo sơ mi nam Oxford',             N'ao-so-mi-nam-oxford',             N'Áo sơ mi Oxford dáng slim fit, vải dày dặn',               N'https://picsum.photos/seed/ao-so-mi-oxford/400/400',  N'Màu sắc',    N'Kích thước', 1),
        (4,  6,  5, N'Quần jean nam slim fit',          N'quan-jean-nam-slim-fit',          N'Quần jean co giãn, dáng ôm vừa phải',                      N'https://picsum.photos/seed/quan-jean-slim/400/400',   N'Màu sắc',    N'Kích thước', 1),
        (5,  6,  5, N'Quần kaki nam',                   N'quan-kaki-nam',                   N'Quần kaki nam form regular, vải mềm',                       N'https://picsum.photos/seed/quan-kaki/400/400',        N'Màu sắc',    N'Kích thước', 1),
        (6,  7,  7, N'Giày sneaker trắng',              N'giay-sneaker-trang',              N'Giày sneaker trắng basic, đế cao su bền',                   N'https://picsum.photos/seed/sneaker-trang/400/400',    N'Kích thước', NULL,          1),
        (7,  7,  7, N'Dép quai ngang nam',              N'dep-quai-ngang-nam',              N'Dép quai ngang êm chân, phù hợp đi hàng ngày',             N'https://picsum.photos/seed/dep-quai-ngang/400/400',   N'Kích thước', NULL,          1),
        (8,  8,  2, N'iPhone 15 Pro Max',               N'iphone-15-pro-max',               N'iPhone 15 Pro Max chip A17 Pro, camera 48MP',                N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'Màu',        1),
        (9,  8,  2, N'Samsung Galaxy S24 Ultra',        N'samsung-galaxy-s24-ultra',        N'Samsung Galaxy S24 Ultra, S Pen tích hợp',                  N'https://picsum.photos/seed/samsung-s24/400/400',      N'Dung lượng', N'Màu',        1),
        (10, 9,  2, N'MacBook Air M3',                  N'macbook-air-m3',                  N'MacBook Air chip M3, 15.3 inch Liquid Retina',              N'https://picsum.photos/seed/macbook-air-m3/400/400',   N'Dung lượng', N'Màu',        1),
        (11, 9,  2, N'Lenovo ThinkPad X1 Carbon',       N'lenovo-thinkpad-x1-carbon',       N'ThinkPad X1 Carbon Gen 12, Core Ultra 7',                   N'https://picsum.photos/seed/thinkpad-x1/400/400',      NULL,          NULL,          1),
        (12, 10, 6, N'Tai nghe AirPods Pro 2',          N'tai-nghe-airpods-pro-2',          N'AirPods Pro 2 USB-C, chống ồn chủ động',                   N'https://picsum.photos/seed/airpods-pro-2/400/400',    NULL,          NULL,          1),
        (13, 10, 6, N'Sạc nhanh 65W GaN',              N'sac-nhanh-65w-gan',              N'Sạc nhanh 65W GaN, 3 cổng, gọn nhẹ',                       N'https://picsum.photos/seed/sac-65w-gan/400/400',      NULL,          NULL,          1),
        (14, 11, 3, N'Bàn làm việc gỗ tự nhiên',       N'ban-lam-viec-go-tu-nhien',       N'Bàn làm việc gỗ sồi, kích thước 120x60cm',                 N'https://picsum.photos/seed/ban-lam-viec/400/400',     N'Màu sắc',    NULL,          1),
        (15, 11, 3, N'Ghế công thái học',               N'ghe-cong-thai-hoc',               N'Ghế ergonomic có tựa đầu, tay vịn điều chỉnh',             N'https://picsum.photos/seed/ghe-ergonomic/400/400',    N'Màu sắc',    NULL,          1),
        (16, 12, 3, N'Nồi chiên không dầu 5L',         N'noi-chien-khong-dau-5l',         N'Air fryer 5 lít, 8 chế độ nấu, màn hình cảm ứng',         N'https://picsum.photos/seed/air-fryer/400/400',         NULL,          NULL,          1),
        (17, 12, 3, N'Bộ dao nhà bếp 6 món',           N'bo-dao-nha-bep-6-mon',           N'Bộ dao thép không gỉ kèm block gỗ',                        N'https://picsum.photos/seed/bo-dao/400/400',            NULL,          NULL,          1),
        (18, 13, 4, N'Đắc Nhân Tâm',                   N'dac-nhan-tam',                   N'Dale Carnegie - Nghệ thuật ứng xử và giao tiếp',           N'https://picsum.photos/seed/dac-nhan-tam/400/400',     NULL,          NULL,          1),
        (19, 13, 4, N'Atomic Habits',                   N'atomic-habits',                   N'James Clear - Thay đổi tí hon, hiệu quả bất ngờ',          N'https://picsum.photos/seed/atomic-habits/400/400',    NULL,          NULL,          1),
        (20, 14, 4, N'Nhà Giả Kim',                    N'nha-gia-kim',                    N'Paulo Coelho - Tiểu thuyết triết lý nổi tiếng thế giới',   N'https://picsum.photos/seed/nha-gia-kim/400/400',      NULL,          NULL,          1);
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
        (1,  1,  N'https://picsum.photos/seed/ao-thun-basic-1/600/600',       0, NULL),
        (2,  1,  N'https://picsum.photos/seed/ao-thun-basic-den-1/600/600',   0, N'Đen'),
        (3,  1,  N'https://picsum.photos/seed/ao-thun-basic-den-2/600/600',   1, N'Đen'),
        (4,  1,  N'https://picsum.photos/seed/ao-thun-basic-trang-1/600/600', 0, N'Trắng'),
        (5,  1,  N'https://picsum.photos/seed/ao-thun-basic-trang-2/600/600', 1, N'Trắng'),
        -- Product 2: Áo thun oversize — Đen + Xám (no shared, tests variant-only)
        (6,  2,  N'https://picsum.photos/seed/ao-oversize-den-1/600/600',     0, N'Đen'),
        (7,  2,  N'https://picsum.photos/seed/ao-oversize-den-2/600/600',     1, N'Đen'),
        (8,  2,  N'https://picsum.photos/seed/ao-oversize-xam-1/600/600',     0, N'Xám'),
        (9,  2,  N'https://picsum.photos/seed/ao-oversize-xam-2/600/600',     1, N'Xám'),
        -- Product 3: Áo sơ mi Oxford — shared + Trắng + Xanh
        (10, 3,  N'https://picsum.photos/seed/ao-so-mi-oxford-1/600/600',       0, NULL),
        (11, 3,  N'https://picsum.photos/seed/ao-so-mi-trang-1/600/600',        0, N'Trắng'),
        (12, 3,  N'https://picsum.photos/seed/ao-so-mi-xanh-1/600/600',         0, N'Xanh'),
        -- Product 4-5: Quần — shared only (tests fallback)
        (13, 4,  N'https://picsum.photos/seed/quan-jean-slim-1/600/600',  0, NULL),
        (14, 4,  N'https://picsum.photos/seed/quan-jean-slim-2/600/600',  1, NULL),
        (15, 5,  N'https://picsum.photos/seed/quan-kaki-1/600/600',       0, NULL),
        (16, 5,  N'https://picsum.photos/seed/quan-kaki-2/600/600',       1, NULL),
        -- Product 6-7: Giày dép — no color variants, all shared
        (17, 6,  N'https://picsum.photos/seed/sneaker-trang-1/600/600',      0, NULL),
        (18, 6,  N'https://picsum.photos/seed/sneaker-trang-2/600/600',      1, NULL),
        (19, 7,  N'https://picsum.photos/seed/dep-quai-ngang-1/600/600',     0, NULL),
        (20, 7,  N'https://picsum.photos/seed/dep-quai-ngang-2/600/600',     1, NULL),
        -- Product 8-13: Electronics — all shared
        (21, 8,  N'https://picsum.photos/seed/iphone-15-promax-1/600/600',   0, NULL),
        (22, 8,  N'https://picsum.photos/seed/iphone-15-promax-2/600/600',   1, NULL),
        (23, 9,  N'https://picsum.photos/seed/samsung-s24-1/600/600',        0, NULL),
        (24, 9,  N'https://picsum.photos/seed/samsung-s24-2/600/600',        1, NULL),
        (25, 10, N'https://picsum.photos/seed/macbook-air-m3-1/600/600',     0, NULL),
        (26, 10, N'https://picsum.photos/seed/macbook-air-m3-2/600/600',     1, NULL),
        (27, 11, N'https://picsum.photos/seed/thinkpad-x1-1/600/600',        0, NULL),
        (28, 11, N'https://picsum.photos/seed/thinkpad-x1-2/600/600',        1, NULL),
        (29, 12, N'https://picsum.photos/seed/airpods-pro-2-1/600/600',      0, NULL),
        (30, 12, N'https://picsum.photos/seed/airpods-pro-2-2/600/600',      1, NULL),
        (31, 13, N'https://picsum.photos/seed/sac-65w-gan-1/600/600',        0, NULL),
        -- Product 14: Bàn làm việc — Gỗ sồi + Gỗ óc chó
        (32, 14, N'https://picsum.photos/seed/ban-lam-viec-soi-1/600/600',   0, N'Gỗ sồi'),
        (33, 14, N'https://picsum.photos/seed/ban-lam-viec-oc-cho-1/600/600',0, N'Gỗ óc chó'),
        -- Product 15: Ghế — Đen + Xám
        (34, 15, N'https://picsum.photos/seed/ghe-ergonomic-den-1/600/600',  0, N'Đen'),
        (35, 15, N'https://picsum.photos/seed/ghe-ergonomic-xam-1/600/600',  0, N'Xám'),
        -- Product 16-20: No variants, all shared
        (36, 16, N'https://picsum.photos/seed/air-fryer-1/600/600',          0, NULL),
        (37, 16, N'https://picsum.photos/seed/air-fryer-2/600/600',          1, NULL),
        (38, 17, N'https://picsum.photos/seed/bo-dao-1/600/600',             0, NULL),
        (39, 18, N'https://picsum.photos/seed/dac-nhan-tam-1/600/600',       0, NULL),
        (40, 19, N'https://picsum.photos/seed/atomic-habits-1/600/600',      0, NULL),
        (41, 20, N'https://picsum.photos/seed/nha-gia-kim-1/600/600',        0, NULL);
      SET IDENTITY_INSERT product_images OFF;
    `);
    console.log('  + product_images: 41 rows');

    await qr.release();
  },
};
