import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

// Shop logos/banners live in the Supabase Storage bucket (uploaded from local
// uploads/** alongside this seed). Build the public base from env — no hardcoded
// project ref; falls back to a relative path if Supabase env is absent.
const IMG_BASE =
  process.env.SUPABASE_URL && process.env.SUPABASE_BUCKET
    ? `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}`
    : '';

export const ShopSeed: ISeed = {
  name: 'shop',
  order: 2.5,
  tables: ['shops'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    await qr.query(`
      INSERT INTO shops (id, user_id, name, slug, description, logo_url, banner_url, status, verified_at) VALUES
        (1, 9,  'Shop Thời Trang Hằng', 'shop-thoi-trang-hang',
          'Chuyên thời trang nam nữ chất lượng cao, giá tốt nhất thị trường',
          '${IMG_BASE}/shops/s1-logo.jpg',
          '${IMG_BASE}/shops/s1-banner.jpg',
          'active', '2026-01-15T10:00:00'),
        (2, 10, 'TechZone VN', 'techzone-vn',
          'Điện thoại, laptop, phụ kiện công nghệ chính hãng. Bảo hành uy tín.',
          '${IMG_BASE}/shops/s2-logo.jpg',
          '${IMG_BASE}/shops/s2-banner.jpg',
          'active', '2026-01-20T14:30:00'),
        (3, 11, 'Mai''s Home & Living', 'mais-home-living',
          'Nội thất, đồ dùng nhà bếp cao cấp. Biến ngôi nhà thành tổ ấm.',
          '${IMG_BASE}/shops/s3-logo.jpg',
          '${IMG_BASE}/shops/s3-banner.jpg',
          'active', '2026-02-01T09:00:00'),
        (4, 12, 'Bảo Books', 'bao-books',
          'Sách hay giá tốt. Tủ sách kỹ năng, văn học, kinh doanh.',
          '${IMG_BASE}/shops/s4-logo.jpg',
          '${IMG_BASE}/shops/s4-banner.jpg',
          'active', '2026-02-05T11:15:00'),
        (5, 13, 'Hùng Style', 'hung-style',
          'Quần nam phong cách, chất liệu tốt. Từ jean đến kaki đều có.',
          '${IMG_BASE}/shops/s5-logo.jpg',
          '${IMG_BASE}/shops/s5-banner.jpg',
          'active', '2026-02-10T08:45:00'),
        (6, 14, 'Lan Accessories', 'lan-accessories',
          'Phụ kiện công nghệ: tai nghe, sạc, cáp. Hàng chính hãng giá tốt.',
          '${IMG_BASE}/shops/s6-logo.jpg',
          '${IMG_BASE}/shops/s6-banner.jpg',
          'active', '2026-02-15T13:00:00'),
        (7, 15, 'Sơn Sneakers', 'son-sneakers',
          'Giày dép nam nữ đa dạng mẫu mã. Sneaker, dép quai ngang, sandal.',
          '${IMG_BASE}/shops/s7-logo.jpg',
          '${IMG_BASE}/shops/s7-banner.jpg',
          'active', '2026-02-20T16:30:00');
    `);
    console.log('  + shops: 7 rows');

    await qr.release();
  },
};
