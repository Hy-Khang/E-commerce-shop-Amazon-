import { types } from 'pg';

/**
 * node-postgres returns `numeric`/`decimal` (OID 1700) and `int8`/`bigint`
 * (OID 20) as **strings** to avoid precision loss. The mssql/tedious driver
 * returned them as JS numbers, and the entire codebase treats money
 * (`price`, `total_amount`, `balance`, `commission_amount`, …) and counts as
 * numbers. Without this, `"100" + "50"` becomes `"10050"` (string concat) or
 * `NaN` — a silent, non-throwing bug across checkout / coin / commission /
 * wallet / dashboard.
 *
 * We coerce numeric → float (DECIMAL(10,2) has no precision concern at this
 * scale) and bigint → int (aggregate COUNT/SUM results). Raw QueryBuilder
 * results bypass TypeORM transformers, so this global parser is the only place
 * that also fixes raw SUM/AVG/COUNT rows.
 *
 * Call `registerPgTypeParsers()` once, before any DataSource connects.
 */
let registered = false;

export function registerPgTypeParsers(): void {
  if (registered) return;
  registered = true;

  // numeric / decimal (OID 1700) → number
  types.setTypeParser(1700, (value) =>
    value === null ? null : parseFloat(value),
  );
  // int8 / bigint (OID 20) → number (safe for our row counts / aggregates)
  types.setTypeParser(20, (value) =>
    value === null ? null : parseInt(value, 10),
  );
}
