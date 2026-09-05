-- ============================================
-- Casa Lis POS - Product Categorization Migration (Phase 1)
-- Nested categories, product subcategory/season, seasons table,
-- SKU counters + next_sku RPC, tenant-scoped SKU uniqueness
-- ============================================

-- --------------------------------------------
-- C1.1: Nested categories - add parent_id
-- --------------------------------------------
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- Replace the old (tenant_id, name) unique constraint with a
-- parent-aware unique index so top-level names stay unique per tenant
-- and subcategory names are unique within their parent.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_tenant_id_name_key;

DROP INDEX IF EXISTS categories_tenant_parent_name_unique;
CREATE UNIQUE INDEX categories_tenant_parent_name_unique
  ON categories (
    tenant_id,
    COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
    name
  );

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- --------------------------------------------
-- C1.2: Product subcategory + season
-- --------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS season TEXT;

CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(tenant_id, category, subcategory);
CREATE INDEX IF NOT EXISTS idx_products_season ON products(tenant_id, season);

-- --------------------------------------------
-- C1.3: Snapshot subcategory on sale items
-- --------------------------------------------
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS product_subcategory TEXT;

-- --------------------------------------------
-- C1.4: Rescope products.sku uniqueness to tenant
-- schema.sql declared sku TEXT NOT NULL UNIQUE (global) and migration 001
-- never rescoped it after adding tenant_id.
-- --------------------------------------------
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_tenant_sku_unique'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_tenant_sku_unique UNIQUE (tenant_id, sku);
  END IF;
END $$;

-- --------------------------------------------
-- C1.5: Seasons table (mirrors brands)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seasons_select_tenant" ON seasons;
CREATE POLICY "seasons_select_tenant" ON seasons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = seasons.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "seasons_manage_tenant" ON seasons;
CREATE POLICY "seasons_manage_tenant" ON seasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = seasons.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- --------------------------------------------
-- C1.6: SKU counters table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS sku_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  next_value INTEGER NOT NULL DEFAULT 1,
  UNIQUE(tenant_id, prefix)
);

ALTER TABLE sku_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sku_counters_select_tenant" ON sku_counters;
CREATE POLICY "sku_counters_select_tenant" ON sku_counters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = sku_counters.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "sku_counters_manage_tenant" ON sku_counters;
CREATE POLICY "sku_counters_manage_tenant" ON sku_counters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = sku_counters.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- --------------------------------------------
-- C1.7: next_sku RPC - atomic per-tenant SKU generation
-- Returns '{PREFIX}-{zero-padded value}', e.g. 'CAM-00001'.
-- The UPDATE takes a row lock on the counter row, making increments atomic.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION next_sku(p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant UUID;
  v_value INTEGER;
BEGIN
  v_tenant := current_tenant_id();
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'next_sku: no tenant in current session';
  END IF;

  INSERT INTO sku_counters (tenant_id, prefix, next_value)
  VALUES (v_tenant, p_prefix, 1)
  ON CONFLICT (tenant_id, prefix) DO NOTHING;

  UPDATE sku_counters
  SET next_value = next_value + 1
  WHERE tenant_id = v_tenant AND prefix = p_prefix
  RETURNING next_value - 1 INTO v_value;

  RETURN p_prefix || '-' || lpad(v_value::text, 5, '0');
END;
$$;

-- --------------------------------------------
-- C1.8: Seed defaults + backfill
-- --------------------------------------------
INSERT INTO seasons (tenant_id, name)
SELECT t.id, 'Permanente'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM seasons s
  WHERE s.tenant_id = t.id AND s.name = 'Permanente'
);

INSERT INTO brands (tenant_id, name)
SELECT t.id, 'Genérica'
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM brands b
  WHERE b.tenant_id = t.id AND b.name = 'Genérica'
);

UPDATE products SET season = 'Permanente' WHERE season IS NULL;
UPDATE products SET brand = 'Genérica' WHERE brand IS NULL;
