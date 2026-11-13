-- ============================================
-- Casa Lis POS - Converge remaining product_sizes into product_variants
-- Phase 1 of the variant catalog refactor (Option A: everything from variants).
--
-- Migration 016 half-migrated sizes into variants:
--   * it copied each product_sizes row into a product_variants row as
--     {"Talla": <size>}, but with ON CONFLICT (tenant_id, sku) DO NOTHING,
--     so rows whose computed SKU collided were silently skipped and their
--     stock never reached the variant system;
--   * it left every product_sizes row in place, so products can hold BOTH a
--     product_sizes row and the matching product_variants row (dual rows);
--   * its product_attributes upsert emitted one candidate row per size and
--     would abort with "ON CONFLICT DO UPDATE command cannot affect row a
--     second time" for any tenant with more than one distinct size.
--
-- This migration converges every product onto variants exactly once:
--   1. Dual rows (product_sizes row + matching {"Talla": size} variant):
--      keep the variant, merge stock/min_stock, drop the size row.
--   2. Remaining product_sizes rows: insert a {"Talla": size} variant with a
--      collision-safe SKU (numeric suffix appended until free - no row is
--      ever skipped).
--   3. Upsert the per-tenant "Talla" attribute with the union of all size
--      names, aggregated to exactly one row per tenant (fixing the 016 shape).
--   4. Flag products carrying Talla variants (has_variants = TRUE and
--      'Talla' in variant_attributes). products.stock is maintained by the
--      trg_update_variant_stock trigger (created in 016), which recomputes
--      stock = SUM(variant stock) after every product_variants write; the
--      statements below therefore keep products.stock correct for free.
--   5. Delete every product_sizes row. The TABLE itself stays in place until
--      Phase 3 drops it.
--
-- Matching rule (per phase plan): a product_sizes row matches a variant when
-- the variant's attributes->>'Talla' equals the row's size for the same
-- product (multi-dimension variants such as {"Color": ..., "Talla": "M"}
-- also match size "M").
--
-- Idempotent: after the first run product_sizes is empty, so every statement
-- is a no-op on re-runs; the attribute upsert merges values and the product
-- flag update only touches rows that still need the flags.
--
-- Numbering note: the phase plan drafted this migration as 021, but 020 is
-- taken and 021 is reserved for a later phase adjustment, so this file takes
-- 022. Phase 3's DROP TABLE migration will be numbered after this one.
--
-- Production reconciliation: if this migration is ever applied by hand
-- (psql / SQL editor) instead of via `supabase db push`, record it in the
-- migration ledger afterwards with:
--   supabase migration repair --status applied 022_migrate_remaining_product_sizes_to_variants
-- ============================================

-- --------------------------------------------
-- 1. Dual rows: merge product_sizes stock into the matching Talla variant.
-- --------------------------------------------
-- Stock-merge choice: GREATEST(variant, size row).
-- Migration 016 created the variant as a copy of the size row's stock and
-- left the size row in place. Every later write decremented or restored
-- exactly ONE of the two rows (size-path sales and the size editor touched
-- product_sizes; variant-path sales touched product_variants), so both rows
-- drifted apart from the same base stock S. SUM would count that shared base
-- twice (overcounting by the whole base); GREATEST overcounts by at most the
-- smaller of the two drifts and can never drop units that one of the rows
-- still reports, so it is the closer and safer reconstruction. min_stock
-- uses GREATEST for the same reason: keep the higher low-stock threshold.
UPDATE product_variants pv
SET
  stock = GREATEST(pv.stock, ps.stock),
  min_stock = GREATEST(pv.min_stock, ps.min_stock),
  updated_at = NOW()
FROM product_sizes ps
WHERE pv.product_id = ps.product_id
  AND pv.attributes->>'Talla' = ps.size;

-- --------------------------------------------
-- 2. Remaining product_sizes rows: insert Talla variants with
--    collision-safe SKUs. Nothing is skipped: every row is inserted.
--    The DO block (instead of pure set-based SQL) exists only to make the
--    SKU probing exact - a set-based suffix cross-join cannot guarantee
--    unique free SKUs across mixed bases (a suffixed candidate of base "X"
--    can equal base "X-1"). Rows are inserted as we iterate, so later rows
--    also see earlier inserts and cannot collide with each other.
--    price/cost_price stay NULL so the variant inherits the parent product.
-- --------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_sku TEXT;
  v_n INT;
BEGIN
  FOR r IN
    SELECT
      ps.tenant_id,
      ps.product_id,
      ps.size,
      ps.stock,
      ps.min_stock,
      COALESCE(ps.sku, p.sku || '-' || ps.size) AS base_sku
    FROM product_sizes ps
    JOIN products p ON p.id = ps.product_id
    WHERE NOT EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = ps.product_id
        AND pv.attributes->>'Talla' = ps.size
    )
    ORDER BY ps.tenant_id, ps.product_id, ps.size
  LOOP
    -- Probe the base SKU, then base-1, base-2, ... until free under
    -- UNIQUE(tenant_id, sku).
    v_sku := r.base_sku;
    v_n := 1;
    WHILE EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.tenant_id = r.tenant_id AND pv.sku = v_sku
    ) LOOP
      v_sku := r.base_sku || '-' || v_n;
      v_n := v_n + 1;
    END LOOP;

    INSERT INTO product_variants (tenant_id, product_id, sku, price, cost_price, stock, min_stock, attributes)
    VALUES (r.tenant_id, r.product_id, v_sku, NULL, NULL, r.stock, r.min_stock, jsonb_build_object('Talla', r.size));
  END LOOP;
END $$;

-- --------------------------------------------
-- 3. Per-tenant "Talla" attribute: union of all size names, aggregated to
--    exactly one row per tenant (016 emitted one candidate row per size and
--    aborted on multi-size tenants). ON CONFLICT merges values, keeping any
--    names already registered.
-- --------------------------------------------
INSERT INTO product_attributes (tenant_id, name, values)
SELECT
  pv.tenant_id,
  'Talla',
  ARRAY_AGG(DISTINCT pv.attributes->>'Talla' ORDER BY pv.attributes->>'Talla')
FROM product_variants pv
WHERE pv.attributes->>'Talla' IS NOT NULL
GROUP BY pv.tenant_id
ON CONFLICT (tenant_id, name) DO UPDATE
SET values = ARRAY(
  SELECT DISTINCT unnest(product_attributes.values || EXCLUDED.values)
);

-- --------------------------------------------
-- 4. Flag products carrying Talla variants. Size-migrated products carry an
--    empty variant_attributes, so this sets ARRAY['Talla'] exactly; the
--    CASE only appends when some other dimension is already registered so
--    existing metadata survives (data-loss safety beyond the plan's literal
--    ARRAY['Talla'], at no behavioral cost). Plain products are untouched.
--    products.stock is recomputed by trg_update_variant_stock on the
--    variant writes above (verified post-reset: products.stock = SUM of
--    variant stock for every product with variants).
-- --------------------------------------------
UPDATE products p
SET
  has_variants = TRUE,
  variant_attributes = CASE
    WHEN 'Talla' = ANY(COALESCE(p.variant_attributes, '{}')) THEN p.variant_attributes
    ELSE COALESCE(p.variant_attributes, '{}') || ARRAY['Talla']
  END
WHERE EXISTS (
  SELECT 1 FROM product_variants pv
  WHERE pv.product_id = p.id
    AND pv.attributes->>'Talla' IS NOT NULL
)
  AND (
    NOT p.has_variants
    OR NOT ('Talla' = ANY(COALESCE(p.variant_attributes, '{}')))
  );

-- --------------------------------------------
-- 5. Safety guard: every remaining size row must now have a matching Talla
--    variant. Fail loudly (and roll back) instead of losing rows silently.
-- --------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM product_sizes ps
    WHERE NOT EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = ps.product_id
        AND pv.attributes->>'Talla' = ps.size
    )
  ) THEN
    RAISE EXCEPTION '022: product_sizes rows without a matching Talla variant remain; aborting to avoid data loss';
  END IF;
END $$;

-- --------------------------------------------
-- 6. Zero rows remain. The TABLE is dropped in Phase 3.
-- --------------------------------------------
DELETE FROM product_sizes;
