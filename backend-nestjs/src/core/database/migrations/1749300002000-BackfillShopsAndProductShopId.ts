import { MigrationInterface, QueryRunner } from 'typeorm';
import { generateSlug } from '../../../common/utils/slug.util';

export class BackfillShopsAndProductShopId1749300002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create shops for all seller-role users
    const sellers: { id: number; full_name: string }[] = await queryRunner.query(`
      SELECT u.id, u.full_name FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'seller'
    `);

    for (const seller of sellers) {
      const slug = generateSlug(seller.full_name) + '-' + seller.id;
      await queryRunner.query(
        `INSERT INTO shops (user_id, name, slug, status, verified_at) VALUES (@0, @1, @2, 'active', SYSUTCDATETIME())`,
        [seller.id, seller.full_name, slug],
      );
    }

    // 2. Validate: shop count matches seller count
    const [{ shopCount }] = await queryRunner.query(`SELECT COUNT(*) AS shopCount FROM shops`);
    const [{ sellerCount }] = await queryRunner.query(`
      SELECT COUNT(*) AS sellerCount FROM users u
      INNER JOIN roles r ON u.role_id = r.id WHERE r.name = 'seller'
    `);

    if (parseInt(shopCount, 10) !== parseInt(sellerCount, 10)) {
      throw new Error(`Shop count (${shopCount}) does not match seller count (${sellerCount}). Rolling back.`);
    }

    // 3. Backfill products.shop_id from seller_id
    await queryRunner.query(`
      UPDATE p SET p.shop_id = s.id
      FROM products p
      INNER JOIN shops s ON p.seller_id = s.user_id
      WHERE p.seller_id IS NOT NULL
    `);

    // 4. Assert no orphaned products
    const [{ orphanCount }] = await queryRunner.query(`
      SELECT COUNT(*) AS orphanCount FROM products
      WHERE seller_id IS NOT NULL AND shop_id IS NULL
    `);

    if (parseInt(orphanCount, 10) > 0) {
      throw new Error(`Found ${orphanCount} orphaned products (seller_id set but shop_id NULL). Rolling back.`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Clear shop_id from products
    await queryRunner.query(`UPDATE products SET shop_id = NULL`);

    // Delete all shops
    await queryRunner.query(`DELETE FROM shops`);
  }
}
