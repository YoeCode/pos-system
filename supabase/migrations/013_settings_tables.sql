-- ============================================
-- Casa Lis POS - Settings Persistence Migration
-- Move categories, brands, sizes, size_groups from localStorage to Supabase
-- ============================================

-- --------------------------------------------
-- S1.1: Create categories table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_tenant" ON categories;
CREATE POLICY "categories_select_tenant" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = categories.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "categories_manage_tenant" ON categories;
CREATE POLICY "categories_manage_tenant" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = categories.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- --------------------------------------------
-- S1.2: Create brands table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_select_tenant" ON brands;
CREATE POLICY "brands_select_tenant" ON brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = brands.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "brands_manage_tenant" ON brands;
CREATE POLICY "brands_manage_tenant" ON brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = brands.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- --------------------------------------------
-- S1.3: Create sizes table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sizes_select_tenant" ON sizes;
CREATE POLICY "sizes_select_tenant" ON sizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = sizes.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "sizes_manage_tenant" ON sizes;
CREATE POLICY "sizes_manage_tenant" ON sizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = sizes.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- --------------------------------------------
-- S1.4: Create size_groups table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS size_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

ALTER TABLE size_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "size_groups_select_tenant" ON size_groups;
CREATE POLICY "size_groups_select_tenant" ON size_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = size_groups.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "size_groups_manage_tenant" ON size_groups;
CREATE POLICY "size_groups_manage_tenant" ON size_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = size_groups.tenant_id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );
