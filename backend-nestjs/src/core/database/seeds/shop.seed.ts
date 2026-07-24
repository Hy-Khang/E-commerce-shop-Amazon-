import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

export const ShopSeed: ISeed = {
  name: 'shop',
  order: 2.5,
  tables: ['shops'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      SET IDENTITY_INSERT shops ON;
      INSERT INTO shops (id, user_id, name, slug, description, logo_url, banner_url, status, verified_at) VALUES
        (1, 9,  N'Shop Thời Trang Hằng', N'shop-thoi-trang-hang',
          N'Chuyên thời trang nam nữ chất lượng cao, giá tốt nhất thị trường',
          N'https://picsum.photos/seed/shop-hang-logo/200/200',
          N'https://picsum.photos/seed/shop-hang-banner/1200/300',
          N'active', '2026-01-15T10:00:00'),
        (2, 10, N'TechZone VN', N'techzone-vn',
          N'Điện thoại, laptop, phụ kiện công nghệ chính hãng. Bảo hành uy tín.',
          N'https://picsum.photos/seed/techzone-logo/200/200',
          N'https://picsum.photos/seed/techzone-banner/1200/300',
          N'active', '2026-01-20T14:30:00'),
        (3, 11, N'Mai''s Home & Living', N'mais-home-living',
          N'Nội thất, đồ dùng nhà bếp cao cấp. Biến ngôi nhà thành tổ ấm.',
          N'https://picsum.photos/seed/mai-home-logo/200/200',
          N'https://picsum.photos/seed/mai-home-banner/1200/300',
          N'active', '2026-02-01T09:00:00'),
        (4, 12, N'Bảo Books', N'bao-books',
          N'Sách hay giá tốt. Tủ sách kỹ năng, văn học, kinh doanh.',
          N'https://picsum.photos/seed/bao-books-logo/200/200',
          N'https://picsum.photos/seed/bao-books-banner/1200/300',
          N'active', '2026-02-05T11:15:00'),
        (5, 13, N'Hùng Style', N'hung-style',
          N'Quần nam phong cách, chất liệu tốt. Từ jean đến kaki đều có.',
          N'https://picsum.photos/seed/hung-style-logo/200/200',
          N'https://picsum.photos/seed/hung-style-banner/1200/300',
          N'active', '2026-02-10T08:45:00'),
        (6, 14, N'Lan Accessories', N'lan-accessories',
          N'Phụ kiện công nghệ: tai nghe, sạc, cáp. Hàng chính hãng giá tốt.',
          N'https://picsum.photos/seed/lan-acc-logo/200/200',
          N'https://picsum.photos/seed/lan-acc-banner/1200/300',
          N'active', '2026-02-15T13:00:00'),
        (7, 15, N'Sơn Sneakers', N'son-sneakers',
          N'Giày dép nam nữ đa dạng mẫu mã. Sneaker, dép quai ngang, sandal.',
          N'https://picsum.photos/seed/son-sneakers-logo/200/200',
          N'https://picsum.photos/seed/son-sneakers-banner/1200/300',
          N'active', '2026-02-20T16:30:00');
      SET IDENTITY_INSERT shops OFF;
    `);
    console.log('  + shops: 7 rows');

    await qr.release();
  },
};
