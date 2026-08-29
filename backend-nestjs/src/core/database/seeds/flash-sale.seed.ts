import { DataSource } from 'typeorm';
import { ISeed } from './seed.interface';

interface VariantRow {
  id: number;
  price: string;
  shop_id: number;
  user_id: number;
}

export const FlashSaleSeed: ISeed = {
  name: 'flash-sale',
  order: 9,
  tables: ['flash_sale_items', 'flash_sales'],

  async run(ds: DataSource) {
    const qr = ds.createQueryRunner();

    // Campaign 1 is live (active) with approved deals; campaign 2 is upcoming
    // (scheduled) and currently OPEN for seller registration.
    await qr.query(`
      SET IDENTITY_INSERT flash_sales ON;
      INSERT INTO flash_sales
        (id, name, registration_starts_at, registration_ends_at, starts_at, ends_at, min_discount_percent, status, is_active) VALUES
        (1, N'Flash Sale Cuối Tuần',  '2026-08-01T00:00:00', '2026-08-10T00:00:00', '2026-08-15T00:00:00', '2026-12-31T23:59:59', 10, N'active',    1),
        (2, N'Flash Sale Giáng Sinh', '2026-08-25T00:00:00', '2026-09-30T00:00:00', '2026-10-01T00:00:00', '2026-10-07T23:59:59', 15, N'scheduled', 1);
      SET IDENTITY_INSERT flash_sales OFF;
    `);
    console.log('  + flash_sales: 2 rows');

    // Resolve real variant ids (+ owning shop & seller) from whatever the product
    // seed created — never hardcode ids (they drift). Only variants whose product
    // belongs to a shop can be flash-registered.
    const variants: VariantRow[] = await qr.query(
      `SELECT TOP 6 v.id, v.price, p.shop_id, s.user_id
         FROM product_variants v
         INNER JOIN products p ON p.id = v.product_id
         INNER JOIN shops s ON s.id = p.shop_id
        ORDER BY v.id ASC`,
    );

    if (variants.length === 0) {
      console.log('  ! flash_sale_items: skipped (no shop-owned variants found)');
      await qr.release();
      return;
    }

    // Flash price = ~70% of the variant's regular price (rounded to 1.000 VND) —
    // comfortably above both campaigns' minimum discount floors.
    const flashPriceOf = (price: string): number => {
      const discounted = Number(price) * 0.7;
      return Math.max(1000, Math.round(discounted / 1000) * 1000);
    };

    const values = variants
      .map((v, i) => {
        const campaignId = i < 4 ? 1 : 2; // first 4 → active/approved, rest → scheduled/pending
        const flashPrice = flashPriceOf(v.price);
        const flashQuantity = 15 + i * 5;
        const soldQuantity = campaignId === 1 ? i * 2 : 0;
        const status = campaignId === 1 ? 'approved' : 'pending';
        const reviewedBy = campaignId === 1 ? '1' : 'NULL';
        const reviewedAt = campaignId === 1 ? 'SYSUTCDATETIME()' : 'NULL';
        return `(${campaignId}, ${v.id}, ${v.shop_id}, ${flashPrice}, ${flashQuantity}, ${soldQuantity}, N'${status}', ${v.user_id}, ${reviewedBy}, ${reviewedAt})`;
      })
      .join(',\n        ');

    await qr.query(`
      INSERT INTO flash_sale_items
        (flash_sale_id, product_variant_id, shop_id, flash_price, flash_quantity, sold_quantity, status, created_by, reviewed_by, reviewed_at) VALUES
        ${values};
    `);
    console.log(`  + flash_sale_items: ${variants.length} rows`);

    await qr.release();
  },
};
