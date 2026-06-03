import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const OrderSeed: ISeed = {
  name: 'order',
  order: 4,
  tables: ['order_items', 'orders'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT orders ON;
      INSERT INTO orders (id, user_id, status, payment_method, payment_status, shipping_fee, total_amount, shipping_address, coupon_code, discount_amount) VALUES
        (1, 2, N'delivered',  N'cod',     N'paid',   30000, 457000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0),
        (2, 2, N'delivered',  N'banking', N'paid',   0,     32990000,
          N'{"full_name":"Nguyễn Văn An","phone":"0901000001","address_line":"123 Lê Lợi, Quận 1","city":"Hồ Chí Minh"}',
          NULL, 0),
        (3, 3, N'shipping',   N'cod',     N'unpaid', 30000, 1048000,
          N'{"full_name":"Trần Thị Bình","phone":"0901000002","address_line":"789 Trần Hưng Đạo, Quận 5","city":"Hồ Chí Minh"}',
          NULL, 0),
        (4, 4, N'confirmed',  N'banking', N'paid',   30000, 5069000,
          N'{"full_name":"Lê Hoàng Cường","phone":"0901000003","address_line":"12 Hoàng Diệu, Hải Châu","city":"Đà Nẵng"}',
          NULL, 0),
        (5, 5, N'pending',    N'cod',     N'unpaid', 30000, 397000,
          N'{"full_name":"Phạm Minh Đức","phone":"0901000004","address_line":"34 Tràng Tiền, Hoàn Kiếm","city":"Hà Nội"}',
          NULL, 0);
      SET IDENTITY_INSERT orders OFF;
    `);
    console.log('  + orders: 5 rows');

    await qr.query(`
      SET IDENTITY_INSERT order_items ON;
      INSERT INTO order_items (id, order_id, product_variant_id, product_name, sku, price, quantity, thumbnail_url, option1_label, option1_value, option2_label, option2_value) VALUES
        (1, 1, 1,  N'Áo thun nam basic cotton', N'ATB-DEN-M', 199000, 2,
          N'https://picsum.photos/seed/ao-thun-basic/400/400', N'Màu sắc', N'Đen', N'Kích thước', N'M'),
        (2, 1, 26, N'Dép quai ngang nam', N'DQN-41', 250000, 1,
          N'https://picsum.photos/seed/dep-quai-ngang/400/400', N'Kích thước', N'41', NULL, NULL),
        (3, 2, 28, N'iPhone 15 Pro Max', N'IP15PM-256-TT', 32990000, 1,
          N'https://picsum.photos/seed/iphone-15-promax/400/400', N'Dung lượng', N'256GB', N'Màu', N'Titan tự nhiên'),
        (4, 3, 10, N'Áo sơ mi nam Oxford', N'ASM-TRANG-M', 389000, 1,
          N'https://picsum.photos/seed/ao-so-mi-oxford/400/400', N'Màu sắc', N'Trắng', N'Kích thước', N'M'),
        (5, 3, 17, N'Quần jean nam slim fit', N'QJS-DEN-32', 550000, 1,
          N'https://picsum.photos/seed/quan-jean-slim/400/400', N'Màu sắc', N'Đen', N'Kích thước', N'32'),
        (6, 4, 40, N'Ghế công thái học', N'GCT-DEN', 4290000, 1,
          N'https://picsum.photos/seed/ghe-ergonomic/400/400', N'Màu sắc', N'Đen', NULL, NULL),
        (7, 4, 37, N'Sạc nhanh 65W GaN', N'SN65W-GAN', 549000, 1,
          N'https://picsum.photos/seed/sac-65w-gan/400/400', NULL, NULL, NULL, NULL),
        (8, 5, 6,  N'Áo thun nam oversize', N'ATO-DEN-L', 249000, 1,
          N'https://picsum.photos/seed/ao-thun-oversize/400/400', N'Màu sắc', N'Đen', N'Kích thước', N'L'),
        (9, 5, 44, N'Đắc Nhân Tâm', N'DNT-01', 69000, 1,
          N'https://picsum.photos/seed/dac-nhan-tam/400/400', NULL, NULL, NULL, NULL);
      SET IDENTITY_INSERT order_items OFF;
    `);
    console.log('  + order_items: 9 rows');

    await qr.release();
  },
};
