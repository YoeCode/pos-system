-- ============================================
-- Casa Lis POS - Drop the legacy product_sizes table
-- Phase 3 of the variant catalog refactor (Option A: everything from variants).
--
-- Migration 022 converged EVERY product_sizes row into a product_variants row
-- with {"Talla": <size>} and then emptied the table. This migration removes
-- the now-dead table so the catalog has exactly one stock model:
-- products.stock (plain) / product_variants (Talla and N-dimension).
--
-- Dependencies verified before dropping:
--   * product_sizes only REFERENCES products(id) and tenants(id) as a child
--     (both ON DELETE CASCADE from the parent side). No table references
--     product_sizes, so there are no child objects to cascade and a plain DROP
--     is safe - the table's own index and RLS policies are removed with it.
--   * The application code paths that read/wrote product_sizes are removed in
--     the same change set (mapDbProduct, updateProduct sizes-diff,
--     updateProductSize, reduceStock/restoreStock size branches). Historical
--     sale lines keep rendering from sale_items.selected_size, which is
--     untouched here.
--
-- Guard: this migration ABORTS loudly if product_sizes still holds any row.
-- That can only happen if 022 did not run (or did not converge every row), in
-- which case dropping the table would silently lose stock. Run 022 first.
--
-- Idempotent: after the first run the table is gone, so the guard is skipped
-- and DROP TABLE IF EXISTS is a no-op on re-runs.
--
-- Production reconciliation: if this migration is ever applied by hand
-- (psql / SQL editor) instead of via `supabase db push`, record it in the
-- migration ledger afterwards with:
--   supabase migration repair --status applied 023_drop_product_sizes
-- ============================================

-- --------------------------------------------
-- 1. Guard: refuse to drop a non-empty table. The inner SELECT is only planned
--    and run when the outer check confirms the table still exists, so re-runs
--    (table already dropped) never error on a missing relation.
-- --------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.product_sizes') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM product_sizes) THEN
      RAISE EXCEPTION
        '023: product_sizes still contains rows; run 022 to converge them into product_variants before dropping the table';
    END IF;
  END IF;
END $$;

-- --------------------------------------------
-- 2. Drop the empty legacy table (idempotent). Its index and RLS policies go
--    with it. No CASCADE needed: nothing depends on product_sizes.
-- --------------------------------------------
DROP TABLE IF EXISTS product_sizes;
