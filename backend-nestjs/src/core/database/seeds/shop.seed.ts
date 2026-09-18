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

    // pickup_address + latitude/longitude seed the shop's origin point for
    // distance-based shipping (H1) and the Order Tracking map. Spread across
    // HCM / Hà Nội / Đà Nẵng so checkout fees vary by distance in the demo
    // (local ⇒ ~min fee, cross-province ⇒ cap).
    await qr.query(`
      INSERT INTO shops (id, user_id, name, slug, description, logo_url, banner_url, pickup_address, latitude, longitude, status, verified_at) VALUES
        (1, 9,  'Shop Thời Trang Hằng', 'shop-thoi-trang-hang',
          'Chuyên thời trang nam nữ chất lượng cao, giá tốt nhất thị trường',
          '${IMG_BASE}/shops/s1-logo.jpg',
          '${IMG_BASE}/shops/s1-banner.jpg',
          '15 Lê Lợi, Quận 1, Hồ Chí Minh', 10.7769, 106.7009,
          'active', '2026-01-15T10:00:00'),
        (2, 10, 'TechZone VN', 'techzone-vn',
          'Điện thoại, laptop, phụ kiện công nghệ chính hãng. Bảo hành uy tín.',
          '${IMG_BASE}/shops/s2-logo.jpg',
          '${IMG_BASE}/shops/s2-banner.jpg',
          '20 Cầu Giấy, Cầu Giấy, Hà Nội', 21.0313, 105.7965,
          'active', '2026-01-20T14:30:00'),
        (3, 11, 'Mai''s Home & Living', 'mais-home-living',
          'Nội thất, đồ dùng nhà bếp cao cấp. Biến ngôi nhà thành tổ ấm.',
          '${IMG_BASE}/shops/s3-logo.jpg',
          '${IMG_BASE}/shops/s3-banner.jpg',
          '88 Nguyễn Thị Thập, Quận 7, Hồ Chí Minh', 10.7340, 106.7215,
          'active', '2026-02-01T09:00:00'),
        (4, 12, 'Bảo Books', 'bao-books',
          'Sách hay giá tốt. Tủ sách kỹ năng, văn học, kinh doanh.',
          '${IMG_BASE}/shops/s4-logo.jpg',
          '${IMG_BASE}/shops/s4-banner.jpg',
          '30 Bạch Đằng, Hải Châu, Đà Nẵng', 16.0544, 108.2022,
          'active', '2026-02-05T11:15:00'),
        (5, 13, 'Hùng Style', 'hung-style',
          'Quần nam phong cách, chất liệu tốt. Từ jean đến kaki đều có.',
          '${IMG_BASE}/shops/s5-logo.jpg',
          '${IMG_BASE}/shops/s5-banner.jpg',
          '210 Điện Biên Phủ, Bình Thạnh, Hồ Chí Minh', 10.8106, 106.7091,
          'active', '2026-02-10T08:45:00'),
        (6, 14, 'Lan Accessories', 'lan-accessories',
          'Phụ kiện công nghệ: tai nghe, sạc, cáp. Hàng chính hãng giá tốt.',
          '${IMG_BASE}/shops/s6-logo.jpg',
          '${IMG_BASE}/shops/s6-banner.jpg',
          '45 Thái Hà, Đống Đa, Hà Nội', 21.0122, 105.8267,
          'active', '2026-02-15T13:00:00'),
        (7, 15, 'Sơn Sneakers', 'son-sneakers',
          'Giày dép nam nữ đa dạng mẫu mã. Sneaker, dép quai ngang, sandal.',
          '${IMG_BASE}/shops/s7-logo.jpg',
          '${IMG_BASE}/shops/s7-banner.jpg',
          '99 Cộng Hòa, Tân Bình, Hồ Chí Minh', 10.8014, 106.6528,
          'active', '2026-02-20T16:30:00');
    `);
    console.log('  + shops: 7 rows');

    await qr.release();
  },
};
