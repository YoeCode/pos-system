-- ============================================
-- Casa Lis POS - Product Variants System (Phase 2)
-- Unified variant system replacing product_sizes
-- Multi-attribute support (Color, Size, Material, etc.)
-- ============================================

-- --------------------------------------------
-- V1.1: product_attributes table
-- Stores available attributes per tenant
-- (e.g., "Color" → ["Rojo", "Azul", "Negro"])
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  values TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_attributes_select_tenant" ON product_attributes;
CREATE POLICY "product_attributes_select_tenant" ON product_attributes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = product_attributes.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "product_attributes_manage_tenant" ON product_attributes;
CREATE POLICY "product_attributes_manage_tenant" ON product_attributes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = product_attributes.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_product_attributes_tenant ON product_attributes(tenant_id);

-- --------------------------------------------
-- V1.2: product_variants table
-- Each variant represents a concrete combination
-- (e.g., Color=Rojo + Talla=M with its own SKU, stock)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  price NUMERIC(10,2),
  cost_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, sku),
  UNIQUE(product_id, attributes)
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_variants_select_tenant" ON product_variants;
CREATE POLICY "product_variants_select_tenant" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = product_variants.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "product_variants_manage_tenant" ON product_variants;
CREATE POLICY "product_variants_manage_tenant" ON product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = product_variants.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_tenant ON product_variants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(tenant_id, sku);

-- --------------------------------------------
-- V1.3: Add variant fields to products table
-- --------------------------------------------
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variant_attributes TEXT[] DEFAULT '{}';

-- --------------------------------------------
-- V1.4: Snapshot variant info on sale_items
-- --------------------------------------------
ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS variant_id UUID,
  ADD COLUMN IF NOT EXISTS variant_sku TEXT,
  ADD COLUMN IF NOT EXISTS variant_attributes JSONB;

-- --------------------------------------------
-- V1.5: Migrate existing product_sizes to product_variants
-- --------------------------------------------

-- Create "Talla" attribute for tenants that have sizes
INSERT INTO product_attributes (tenant_id, name, values)
SELECT DISTINCT
  ps.tenant_id,
  'Talla',
  ARRAY(SELECT DISTINCT unnest(ARRAY[ps.size]))
FROM product_sizes ps
ON CONFLICT (tenant_id, name) DO UPDATE
SET values = ARRAY(
  SELECT DISTINCT unnest(product_attributes.values || EXCLUDED.values)
);

-- Migrate sizes to variants
INSERT INTO product_variants (tenant_id, product_id, sku, price, cost_price, stock, min_stock, attributes)
SELECT
  ps.tenant_id,
  ps.product_id,
  COALESCE(ps.sku, p.sku || '-' || UPPER(REPLACE(ps.size, ' ', '-'))),
  NULL,
  NULL,
  ps.stock,
  COALESCE(ps.min_stock, 0),
  jsonb_build_object('Talla', ps.size)
FROM product_sizes ps
JOIN products p ON p.id = ps.product_id
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- Update products that have sizes to enable variants
UPDATE products p
SET
  has_variants = TRUE,
  variant_attributes = ARRAY['Talla'],
  stock = COALESCE((
    SELECT SUM(pv.stock)
    FROM product_variants pv
    WHERE pv.product_id = p.id
  ), p.stock)
WHERE EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id
);

-- --------------------------------------------
-- V1.6: update_variant_stock trigger
-- Automatically update product.stock when variant stock changes
-- --------------------------------------------
CREATE OR REPLACE FUNCTION update_variant_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = COALESCE((
    SELECT SUM(pv.stock)
    FROM product_variants pv
    WHERE pv.product_id = COALESCE(NEW.product_id, OLD.product_id)
  ), 0),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_variant_stock ON product_variants;
CREATE TRIGGER trg_update_variant_stock
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_product_stock();
