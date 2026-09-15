import { AppDataSource } from './data-source';
import { ISeed } from './seeds/seed.interface';
import { AuthSeed } from './seeds/auth.seed';
import { UserProfileSeed } from './seeds/user-profile.seed';
import { ProductSeed } from './seeds/product.seed';
import { OrderSeed } from './seeds/order.seed';
import { ReviewSeed } from './seeds/review.seed';
import { CouponSeed } from './seeds/coupon.seed';
import { ShopSeed } from './seeds/shop.seed';
import { OrderTrackingSeed } from './seeds/order-tracking.seed';
import { FlashSaleSeed } from './seeds/flash-sale.seed';
import { ChatSeed } from './seeds/chat.seed';
import { CoinSeed } from './seeds/coin.seed';
import { AiChatSeed } from './seeds/ai-chat.seed';
import { UserActivitySeed } from './seeds/user-activity.seed';

const ALL_SEEDS: ISeed[] = [
  AuthSeed,
  UserProfileSeed,
  ShopSeed,
  ProductSeed,
  OrderSeed,
  OrderTrackingSeed,
  ReviewSeed,
  CouponSeed,
  FlashSaleSeed,
  ChatSeed,
  CoinSeed,
  AiChatSeed,
  UserActivitySeed,
].sort((a, b) => a.order - b.order);

// Global delete order: reverse of FK dependency (children before parents, cross-seed aware)
const DELETE_ORDER = [
  'user_activity_log',
  'ai_messages',
  'ai_conversations',
  'ai_settings',
  'coin_transactions',
  'coin_batches',
  'wallet_transactions',
  'withdrawal_requests',
  'seller_wallets',
  'commission_transactions',
  'commission_category_rates',
  'app_settings',
  'messages',
  'conversations',
  'coupon_products',
  'coupon_categories',
  'coupon_usages',
  'coupons',
  'reviews',
  'wishlist_items',
  'recently_viewed',
  'order_tracking_locations',
  'order_status_history',
  'payment_transactions',
  'notifications',
  'order_items',
  'orders',
  'flash_sale_items',
  'flash_sales',
  'cart_items',
  'carts',
  'product_images',
  'product_variants',
  'products',
  'categories',
  'shops',
  'seller_applications',
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
      // Double-quote the identifier (Postgres). DELETE (not TRUNCATE CASCADE) so
      // a stray FK never drags in a table outside DELETE_ORDER.
      await AppDataSource.query(`DELETE FROM "${table}"`);
      console.log(`  - ${table}: cleared`);
    } catch (err: any) {
      // undefined_table (42P01) → table not synced yet; ignore. Others: log.
      if (err.code === '42P01') {
        // Table doesn't exist yet (not synced)
      } else {
        console.log(`  - ${table}: skipped (${err.message?.substring(0, 60)})`);
      }
    }

    try {
      // Reset the id sequence so re-seeds start ids at 1 again. `false` marks the
      // sequence "uncalled" → the next nextval() returns 1. pg_get_serial_sequence
      // resolves the sequence backing "table".id (NULL if none → caught below).
      await AppDataSource.query(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), 1, false)`,
      );
    } catch {
      // No identity/serial column or table doesn't exist — ignore.
    }
  }
}

/**
 * Seeds INSERT explicit ids, but the id sequences were reset to 1 by
 * cleanTables — so without this the app's next insert would collide on the PK.
 * Advance each table's sequence to MAX(id) so the next nextval() is MAX(id)+1.
 */
async function resyncSequences() {
  console.log('\n--- Re-syncing id sequences ---');
  for (const table of DELETE_ORDER) {
    try {
      await AppDataSource.query(
        `SELECT setval(
           pg_get_serial_sequence('"${table}"', 'id'),
           COALESCE((SELECT MAX(id) FROM "${table}"), 1),
           true
         )`,
      );
    } catch {
      // No serial id column / empty table / table missing — ignore.
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

    await resyncSequences();

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
