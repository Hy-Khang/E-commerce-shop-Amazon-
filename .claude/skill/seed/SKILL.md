---
name: seed
description: >
  Create or update database seed data for a specific feature or all features.
  Use when user says "seed", "seed data", "tạo seed", "seed [feature]", "reseed".
  Supports per-feature seeding: auth, user-profile, product, order, review, coupon.
argument-hint: "[feature-name|all]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Database Seed

**Scope:** Create, update, or run seed data files for the e-commerce database. Each seed file handles all entities owned by one feature.

---

## Pre-flight Checks

1. **Working directory** — must be the project root (contains `backend-nestjs/`)
2. **Seed infrastructure exists?** Check `backend-nestjs/src/core/database/seed-runner.ts`
   - If missing → "Seed infrastructure not found. Create it first."
3. **Feature valid?** If argument provided, must match one of: `auth`, `user-profile`, `product`, `order`, `review`, `coupon`, or a new feature name

---

## Required Reading

| Doc | Purpose |
|-----|---------|
| `share-docs/DATABASE.md` | Entity schemas, FK relationships, field types |
| `backend-nestjs/src/core/database/seeds/seed.interface.ts` | ISeed interface to implement |
| Existing seed file for reference pattern | e.g., `seeds/auth.seed.ts` |
| Target feature's `entities/*.entity.ts` | Exact column names and types |

---

## Conventions

### ISeed Interface

```typescript
interface ISeed {
  name: string;       // feature name (e.g., 'auth')
  order: number;      // FK-safe execution order
  tables: string[];   // tables managed, child-first order (for cleanup)
  run(ds: DataSource): Promise<void>;
}
```

### Ordering Rules

Seeds run in this order (FK dependencies):
1. auth (roles, users)
2. user-profile (addresses)
3. product (categories, products, product_variants, product_images)
4. order (orders, order_items)
5. review (reviews)
6. coupon (coupons, coupon_categories, coupon_products)

New features: pick an order number that respects FK dependencies. If the new feature depends on `order`, use order > 4.

### `tables` Array

List tables in **child-first** order (reverse of insert order). The seed runner uses this for DELETE cleanup.

Example for product: `['product_images', 'product_variants', 'products', 'categories']`

### SQL Server Rules

1. **IDENTITY_INSERT** — required for explicit IDs. MUST be in the SAME query string as INSERT (separate `query()` calls lose session state):
   ```typescript
   await qr.query(`
     SET IDENTITY_INSERT ${table} ON;
     INSERT INTO ${table} (...) VALUES (...);
     SET IDENTITY_INSERT ${table} OFF;
   `);
   ```

2. **Unicode strings** — always prefix with `N'...'` for NVARCHAR columns

3. **Explicit IDs** — always specify IDs so data is deterministic and other seeds can reference them by known ID

4. **Use QueryRunner** — create via `ds.createQueryRunner()`, release at end

### Data Guidelines

- Use realistic Vietnamese data (names, addresses, product names)
- Passwords: hash with `bcrypt.hashSync(password, 10)` — only in auth seed
- Prices in VND (no decimals for VND, but column is DECIMAL(10,2))
- Log row counts: `console.log('  + tablename: N rows');`
- Reference existing seed IDs when creating dependent data (e.g., order references user_id from auth seed)
- **Image URLs** — use `https://picsum.photos/seed/{slug}/{width}/{height}` (free, no API key, deterministic). Never use local `/uploads/...` paths — files don't exist in dev.
  - Thumbnails (`thumbnail_url`): `https://picsum.photos/seed/{product-slug}/400/400`
  - Gallery images (`image_url`): `https://picsum.photos/seed/{product-slug-N}/600/600` (append `-1`, `-2` for different images)
  - Order item snapshots: use the same thumbnail URL as the source product

---

## Workflow

### Creating a NEW seed file

1. Read the feature's entity files to understand columns
2. Read `DATABASE.md` for the entity schema
3. Determine the correct `order` number based on FK dependencies
4. Create `backend-nestjs/src/core/database/seeds/[feature].seed.ts`
5. Follow the ISeed interface pattern (see existing seeds for reference)
6. Register in `seed-runner.ts` — import and add to `ALL_SEEDS` array
7. Run `npm run seed` from `backend-nestjs/` to verify

### Updating an EXISTING seed file

1. Read the current seed file
2. Read the entity files for any schema changes
3. Edit the seed file (add/modify/remove data)
4. Run `npm run seed` from `backend-nestjs/` to verify

### Running seeds

```bash
# All seeds
cd backend-nestjs && npm run seed

# Single feature
cd backend-nestjs && npm run seed -- --feature=auth
```

---

## Output

```
Seed operation complete!

Files created/modified:
- backend-nestjs/src/core/database/seeds/[feature].seed.ts

Run: cd backend-nestjs && npm run seed

Verify: connect to SQL Server and check table row counts
```

---

## Important Rules

1. **Always use explicit IDs** — never rely on auto-increment for seed data
2. **Never modify seed.interface.ts** unless adding a new method
3. **Child-first in tables array** — critical for DELETE cleanup
4. **Test by running** — always run `npm run seed` after changes
5. **Keep seeds independent** — each seed can reference IDs from lower-order seeds, but never from higher-order ones

---

## Error Handling

| Error | Action |
|-------|--------|
| Feature not found in runner | Register it in `ALL_SEEDS` array in `seed-runner.ts` |
| FK constraint on DELETE | Check `tables` array order — children must come before parents |
| IDENTITY_INSERT conflict | Ensure `SET IDENTITY_INSERT OFF` is called before the next table's ON |
| Duplicate key error | Check for conflicting IDs with existing seeds |
| Connection error | Verify `.env` file has correct DB credentials |
