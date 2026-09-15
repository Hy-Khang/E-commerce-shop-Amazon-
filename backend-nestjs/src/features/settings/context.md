# Settings Feature

## Purpose
Runtime-editable application config stored as key/value rows in `app_settings`,
so the admin can change behaviour without a redeploy (unlike ENV). Currently
backs the Coin (Hoàn Xu, Module 23) config.

## Entities
- `app_settings` (id, key UNIQUE, value NVARCHAR(500), updated_at, updated_by).
  Values are strings; `SettingsService` casts them to concrete types.

## Endpoints
- `GET /admin/settings/coins` — read coin config (`settings:read`)
- `PATCH /admin/settings/coins` — update coin config (`settings:update`)

## Design decisions
- **String storage, typed accessors:** `getCoinConfig()` resolves the 4
  `coin.*` keys → `CoinConfig`, falling back to `DEFAULT_COIN_CONFIG` for any
  missing/unparsable key (so a fresh DB still works before seeding).
- **Partial update:** `PATCH` only writes the keys present in the body via an
  idempotent upsert (UPDATE-then-INSERT).
- **Consumers:** `CoinModule` and `OrderModule` import `SettingsModule` and
  inject `SettingsService`. No reverse dependency → acyclic.

## Related
- [[project_coin_module23]] — the coin feature this config drives.
