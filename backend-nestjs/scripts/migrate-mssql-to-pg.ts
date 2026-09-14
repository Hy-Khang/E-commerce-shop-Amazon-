/* eslint-disable no-console */
/**
 * ETL: copy every row from the legacy SQL Server database into the new Supabase
 * (PostgreSQL) database, preserving primary keys, then re-sync id sequences.
 * Optionally (`--with-files`) also uploads the local `uploads/products/**`
 * images into Supabase Storage and rewrites the URL columns.
 *
 * Prerequisites:
 *   1. The target Postgres schema already exists (run the baseline migration, or
 *      boot the app once with DB_SYNCHRONIZE=true against an empty database).
 *   2. Both the `mssql` and `pg` drivers are installed (mssql is kept until the
 *      migration is done — see the migration plan Phase 1/6).
 *
 * Env (source = old SQL Server; target = new Supabase Postgres = the standard DB_* vars):
 *   SRC_DB_HOST, SRC_DB_PORT (1433), SRC_DB_USERNAME, SRC_DB_PASSWORD, SRC_DB_DATABASE
 *   DB_HOST, DB_PORT (5432), DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_SSL
 *   (for --with-files) SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET
 *
 * Run: TZ=UTC npm run migrate:etl -- [--with-files]
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { registerPgTypeParsers } from '../src/core/database/pg-type-parsers';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
registerPgTypeParsers();

// Parent-first insertion order = reverse of the seed-runner's DELETE_ORDER.
const INSERT_ORDER = [
  'roles',
  'permissions',
  'role_permissions',
  'users',
  'refresh_tokens',
  'user_auth_providers',
  'oauth_codes',
  'addresses',
  'seller_applications',
  'shops',
  'categories', // self-referencing (parent_id) — handled below
  'products',
  'product_variants',
  'product_images',
  'carts',
  'cart_items',
  'flash_sales',
  'flash_sale_items',
  'orders',
  'order_items',
  'notifications',
  'payment_transactions',
  'order_status_history',
  'order_tracking_locations',
  'recently_viewed',
  'wishlist_items',
  'reviews',
  'coupons',
  'coupon_usages',
  'coupon_categories',
  'coupon_products',
  'conversations',
  'messages',
  'app_settings',
  'commission_category_rates',
  'commission_transactions',
  'seller_wallets',
  'withdrawal_requests',
  'wallet_transactions',
  'coin_batches',
  'coin_transactions',
  'ai_settings',
  'ai_conversations',
  'ai_messages',
  'user_activity_log',
];

const BATCH_SIZE = 500;

const SourceDataSource = new DataSource({
  type: 'mssql',
  host: process.env.SRC_DB_HOST || 'localhost',
  port: parseInt(process.env.SRC_DB_PORT ?? '1433', 10),
  username: process.env.SRC_DB_USERNAME || 'sa',
  password: process.env.SRC_DB_PASSWORD || '',
  database: process.env.SRC_DB_DATABASE || 'ecommerce_shop',
  options: { trustServerCertificate: true, useUTC: true },
});

const TargetDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: { options: '-c timezone=UTC' },
});

async function tableExists(ds: DataSource, table: string): Promise<boolean> {
  const rows = await ds.query(
    `SELECT to_regclass($1) AS reg`,
    [`public.${table}`],
  );
  return rows[0]?.reg != null;
}

async function copyTable(table: string): Promise<void> {
  if (!(await tableExists(TargetDataSource, table))) {
    console.log(`  - ${table}: target table missing, skipped`);
    return;
  }

  // categories is self-referencing (parent_id → categories.id): order parents first.
  const orderBy =
    table === 'categories'
      ? 'ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, id'
      : 'ORDER BY id';

  let rows: Record<string, unknown>[];
  try {
    rows = await SourceDataSource.query(`SELECT * FROM [${table}] ${orderBy}`);
  } catch (err: any) {
    console.log(`  - ${table}: source read failed (${err.message}) — skipped`);
    return;
  }
  if (rows.length === 0) {
    console.log(`  - ${table}: 0 rows`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(', ');

  const runner = TargetDataSource.createQueryRunner();
  await runner.connect();
  let inserted = 0;
  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const params: unknown[] = [];
      const valuesSql = batch
        .map((row) => {
          const placeholders = columns.map((c) => {
            params.push(row[c]);
            return `$${params.length}`;
          });
          return `(${placeholders.join(', ')})`;
        })
        .join(', ');
      await runner.query(
        `INSERT INTO "${table}" (${colList}) VALUES ${valuesSql}`,
        params,
      );
      inserted += batch.length;
    }
    console.log(`  - ${table}: ${inserted} rows`);
  } finally {
    await runner.release();
  }
}

async function resyncSequence(table: string): Promise<void> {
  try {
    await TargetDataSource.query(
      `SELECT setval(
         pg_get_serial_sequence('"${table}"', 'id'),
         COALESCE((SELECT MAX(id) FROM "${table}"), 1),
         true
       )`,
    );
  } catch {
    // No serial id column / empty table — ignore.
  }
}

async function migrateFiles(): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const { readdir, readFile } = await import('fs/promises');
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || 'product-images';
  if (!supabaseUrl || !serviceKey) {
    console.log('\n[files] SUPABASE_URL / SERVICE_ROLE_KEY missing — skipping file upload.');
    return;
  }
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const MIME: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  const uploadsRoot = path.resolve(__dirname, '../uploads');
  const map = new Map<string, string>(); // '/uploads/products/x.jpg' -> public URL

  // Recursively walk uploads/ and upload each file under the same relative path.
  async function walk(dir: string, rel: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      const relPath = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(abs, relPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const contentType = MIME[ext];
      if (!contentType) continue;
      const buffer = await readFile(abs);
      const objectPath = relPath.replace(/^\//, ''); // 'products/x.jpg'
      const { error } = await client.storage
        .from(bucket)
        .upload(objectPath, buffer, { contentType, upsert: true });
      if (error) {
        console.log(`  ! upload failed ${objectPath}: ${error.message}`);
        continue;
      }
      const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
      map.set(`/uploads/${objectPath}`, data.publicUrl);
    }
  }

  console.log('\n[files] Uploading local uploads/ to Supabase Storage...');
  await walk(path.join(uploadsRoot, 'products'), '/products');
  console.log(`[files] Uploaded ${map.size} files. Rewriting URL columns...`);

  // Rewrite each URL column: exact-match replace of '/uploads/...' → public URL.
  const urlColumns: [string, string][] = [
    ['products', 'thumbnail_url'],
    ['product_images', 'image_url'],
    ['shops', 'logo_url'],
    ['shops', 'banner_url'],
    ['seller_applications', 'logo_url'],
    ['seller_applications', 'banner_url'],
  ];
  for (const [table, col] of urlColumns) {
    for (const [oldUrl, newUrl] of map) {
      await TargetDataSource.query(
        `UPDATE "${table}" SET "${col}" = $1 WHERE "${col}" = $2`,
        [newUrl, oldUrl],
      );
    }
  }
  console.log('[files] URL rewrite complete.');
}

async function main() {
  const withFiles = process.argv.includes('--with-files');
  console.log('=== ETL: SQL Server → Supabase (Postgres) ===');
  console.log(`Source: ${process.env.SRC_DB_DATABASE} @ ${process.env.SRC_DB_HOST}`);
  console.log(`Target: ${process.env.DB_DATABASE} @ ${process.env.DB_HOST}`);

  await SourceDataSource.initialize();
  await TargetDataSource.initialize();
  console.log('Connected to both databases.\n');

  // Try to disable FK enforcement for the load (needs elevated privilege; if the
  // Supabase role can't, we still succeed via the parent-first INSERT_ORDER).
  let fkDisabled = false;
  try {
    await TargetDataSource.query(`SET session_replication_role = 'replica'`);
    fkDisabled = true;
    console.log("FK checks disabled (session_replication_role='replica').\n");
  } catch {
    console.log('Could not disable FK checks — relying on insertion order.\n');
  }

  try {
    console.log('--- Copying rows ---');
    for (const table of INSERT_ORDER) {
      await copyTable(table);
    }

    if (fkDisabled) {
      await TargetDataSource.query(`SET session_replication_role = 'origin'`);
    }

    console.log('\n--- Re-syncing id sequences ---');
    for (const table of INSERT_ORDER) {
      await resyncSequence(table);
    }

    if (withFiles) {
      await migrateFiles();
    }

    console.log('\n=== ETL complete ===');
  } catch (err) {
    console.error('\nETL failed:', err);
    process.exitCode = 1;
  } finally {
    await SourceDataSource.destroy();
    await TargetDataSource.destroy();
  }
}

void main();
