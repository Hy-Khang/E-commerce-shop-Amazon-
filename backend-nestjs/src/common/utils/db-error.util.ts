/**
 * PostgreSQL error-code helpers (SQLSTATE, on `error.code` as a **string**).
 *
 * Replaces the SQL Server / tedious codes (`error.number` 2627/2601 unique,
 * 547 FK). node-postgres exposes the SQLSTATE on `error.code`:
 *   - `23505` unique_violation      (was 2627 / 2601)
 *   - `23503` foreign_key_violation (was 547)
 *
 * TypeORM's postgres driver surfaces the driver error as `QueryFailedError`
 * with the pg `code` copied onto it, so checking `error.code` works for both a
 * raw `pg` error and a TypeORM-wrapped one.
 */
function pgCode(err: unknown): string | undefined {
  const e = err as { code?: string; driverError?: { code?: string } };
  return e?.code ?? e?.driverError?.code;
}

export function isUniqueViolation(err: unknown): boolean {
  return pgCode(err) === '23505';
}

export function isFkViolation(err: unknown): boolean {
  return pgCode(err) === '23503';
}
