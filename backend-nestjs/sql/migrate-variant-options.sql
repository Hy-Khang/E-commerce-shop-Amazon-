-- Migration: Add indexes for generic option1/option2 variant system
-- Schema was already applied by TypeORM synchronize.
-- Old color/size data was lost during auto-sync — re-enter via admin UI.
-- This script creates indexes that synchronize doesn't handle.
-- Each index is created independently so partial success is possible.

-- 1. Unique index: no duplicate (product_id, option1, option2) when both are set
CREATE UNIQUE NONCLUSTERED INDEX uq_pv_both_options
  ON product_variants (product_id, option1, option2)
  WHERE option1 IS NOT NULL AND option2 IS NOT NULL;
GO

-- 2. Unique index: no duplicate (product_id, option1) when only option1 is set
CREATE UNIQUE NONCLUSTERED INDEX uq_pv_option1_only
  ON product_variants (product_id, option1)
  WHERE option1 IS NOT NULL AND option2 IS NULL;
GO

-- 3. Lookup index for fast variant queries
CREATE NONCLUSTERED INDEX idx_product_variants_product_options
  ON product_variants (product_id, option1, option2);
GO

-- 4. DEFERRED: Run this AFTER re-entering variant option data via admin UI.
--    This enforces max 1 variant with no options per product.
--    Currently all options are NULL so this would fail.
--
-- CREATE UNIQUE NONCLUSTERED INDEX uq_pv_no_options
--   ON product_variants (product_id)
--   WHERE option1 IS NULL AND option2 IS NULL;
-- GO

PRINT 'Done. After re-entering variant data, uncomment and run index #4.';
