import { AppDataSource } from './data-source';
import { ISeed } from './seeds/seed.interface';
import { AuthSeed } from './seeds/auth.seed';
import { UserProfileSeed } from './seeds/user-profile.seed';
import { ProductSeed } from './seeds/product.seed';
import { OrderSeed } from './seeds/order.seed';
import { ReviewSeed } from './seeds/review.seed';
import { CouponSeed } from './seeds/coupon.seed';
import { ShopSeed } from './seeds/shop.seed';

const ALL_SEEDS: ISeed[] = [
  AuthSeed,
  UserProfileSeed,
  ShopSeed,
  ProductSeed,
  OrderSeed,
  ReviewSeed,
  CouponSeed,
].sort((a, b) => a.order - b.order);

// Global delete order: reverse of FK dependency (children before parents, cross-seed aware)
const DELETE_ORDER = [
  'coupon_products',
  'coupon_categories',
  'coupon_usages',
  'coupons',
  'reviews',
  'wishlist_items',
  'payment_transactions',
  'notifications',
  'order_items',
  'orders',
  'cart_items',
  'carts',
  'product_images',
  'product_variants',
  'products',
  'categories',
  'shops',
  'addresses',
  'oauth_codes',
  'user_auth_providers',
  'refresh_tokens',
  'users',
  'role_permissions',
  'permissions',
  'roles',
];

function parseFeatureArg(): string | null {
  const arg = process.argv.find((a) => a.startsWith('--feature='));
  return arg ? arg.split('=')[1] : null;
}

async function cleanTables() {
  console.log('\n--- Cleaning tables ---');

  for (const table of DELETE_ORDER) {
    try {
      await AppDataSource.query(`DELETE FROM [${table}]`);
      console.log(`  - ${table}: cleared`);
    } catch (err: any) {
      if (err.message?.includes('Invalid object name')) {
        // Table doesn't exist yet (not synced)
      } else {
        console.log(`  - ${table}: skipped (${err.message?.substring(0, 60)})`);
      }
    }

    try {
      await AppDataSource.query(`DBCC CHECKIDENT('${table}', RESEED, 0)`);
    } catch {
      // No identity column or table doesn't exist
    }
  }
}

async function main() {
  const featureFilter = parseFeatureArg();

  console.log('=== Database Seed Runner ===');
  console.log(`Database: ${process.env.DB_DATABASE || 'ecommerce_shop'}`);

  if (featureFilter) {
    console.log(`Feature filter: ${featureFilter}`);
  }

  try {
    await AppDataSource.initialize();
    console.log('Connected to database.');

    const seedsToRun = featureFilter
      ? ALL_SEEDS.filter((s) => s.name === featureFilter)
      : ALL_SEEDS;

    if (seedsToRun.length === 0) {
      console.error(`No seed found for feature: "${featureFilter}"`);
      console.log(`Available: ${ALL_SEEDS.map((s) => s.name).join(', ')}`);
      process.exit(1);
    }

    await cleanTables();

    console.log('\n--- Seeding ---');
    for (const seed of seedsToRun) {
      console.log(`\n[${seed.name}]`);
      await seed.run(AppDataSource);
    }

    console.log('\n=== Seed complete ===');
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

main();
