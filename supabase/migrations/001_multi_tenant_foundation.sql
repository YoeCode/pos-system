-- ============================================
-- Casa Lis POS - Multi-Tenant Migration
-- Row-Level Tenancy Foundation
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- --------------------------------------------
-- T1.1: Create tenants table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'canceled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_employees INTEGER NOT NULL DEFAULT 2,
  max_products INTEGER NOT NULL DEFAULT 100,
  max_sales_monthly INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- T1.2: Create tenant_members table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenants_select_members" ON tenants;
CREATE POLICY "tenants_select_members" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = tenants.id AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tenants_update_owner" ON tenants;
CREATE POLICY "tenants_update_owner" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "tenant_members_select_own" ON tenant_members;
CREATE POLICY "tenant_members_select_own" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tenant_members_manage" ON tenant_members;
CREATE POLICY "tenant_members_manage" ON tenant_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- --------------------------------------------
-- T1.3: Add tenant_id to all business tables (nullable first)
-- --------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cash_box_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cash_box_closures ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- --------------------------------------------
-- T1.7: Create legacy tenant and backfill data
-- MUST run before T1.4 and T1.8
-- --------------------------------------------
INSERT INTO tenants (id, name, slug, plan, max_employees, max_products, max_sales_monthly, subscription_status)
VALUES (
  'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  'Casa Lis Legacy',
  'casalis-legacy',
  'enterprise',
  999,
  9999,
  99999,
  'active'
)
ON CONFLICT (id) DO NOTHING;

UPDATE tenants SET slug = 'casalis-legacy' WHERE id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';

UPDATE employees SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE product_sizes SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE customers SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE sales SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE sale_items SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE cash_box_sessions SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE cash_box_closures SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE refunds SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;
UPDATE settings SET tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' WHERE tenant_id IS NULL;

UPDATE tenants 
SET owner_id = (
  SELECT user_id FROM employees 
  WHERE tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' 
  AND role = 'admin' 
  AND user_id IS NOT NULL 
  ORDER BY created_at 
  LIMIT 1
)
WHERE id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';

UPDATE tenants 
SET owner_id = (
  SELECT user_id FROM employees 
  WHERE tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' 
  AND user_id IS NOT NULL 
  ORDER BY created_at 
  LIMIT 1
)
WHERE id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2' AND owner_id IS NULL;

-- --------------------------------------------
-- T1.4: Refactor settings table for multi-tenant
-- Run AFTER T1.7 backfill so tenant_id has values
-- --------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
    ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
    ALTER TABLE settings ADD PRIMARY KEY (tenant_id);
    ALTER TABLE settings DROP COLUMN IF EXISTS id;
  END IF;
END $$;

-- --------------------------------------------
-- T1.5: Add composite indexes for tenant-scoped queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_product_sizes_tenant ON product_sizes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_tenant ON sale_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_box_sessions_tenant ON cash_box_sessions(tenant_id, is_open);
CREATE INDEX IF NOT EXISTS idx_cash_box_closures_tenant ON cash_box_closures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);

-- --------------------------------------------
-- T1.6: Helper function for current tenant from JWT
-- --------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  BEGIN
    tenant_uuid := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    tenant_uuid := NULL;
  END;
  
  IF tenant_uuid IS NULL THEN
    SELECT tenant_id INTO tenant_uuid
    FROM tenant_members
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_tenant_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = current_tenant_id()
    AND user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- T1.8: Make tenant_id NOT NULL on all tables
-- Run AFTER T1.7 backfill
-- --------------------------------------------
ALTER TABLE employees ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE product_sizes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sale_items ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cash_box_sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE cash_box_closures ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE refunds ALTER COLUMN tenant_id SET NOT NULL;

-- --------------------------------------------
-- T1.9: Create tenant_members for existing employees with user_id
-- --------------------------------------------
INSERT INTO tenant_members (tenant_id, user_id, role, joined_at)
SELECT 
  'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2',
  e.user_id,
  CASE e.role 
    WHEN 'admin' THEN 'owner'::text
    ELSE e.role::text
  END,
  COALESCE(e.created_at, NOW())
FROM employees e
WHERE e.tenant_id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2'
AND e.user_id IS NOT NULL
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- --------------------------------------------
-- T1.10: Add update trigger for tenants table
-- --------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tenants_updated_at'
  ) THEN
    CREATE TRIGGER tenants_updated_at
      BEFORE UPDATE ON tenants
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ============================================
-- RLS POLICIES REFACTOR - Tenant Scoped
-- ============================================

DROP POLICY IF EXISTS "employees_select_active" ON employees;
DROP POLICY IF EXISTS "employees_manage_admin" ON employees;
DROP POLICY IF EXISTS "products_select_active" ON products;
DROP POLICY IF EXISTS "products_manage" ON products;
DROP POLICY IF EXISTS "product_sizes_select" ON product_sizes;
DROP POLICY IF EXISTS "product_sizes_manage" ON product_sizes;
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_manage" ON customers;
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert_own" ON sales;
DROP POLICY IF EXISTS "sale_items_select" ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert" ON sale_items;
DROP POLICY IF EXISTS "cash_box_select" ON cash_box_sessions;
DROP POLICY IF EXISTS "cash_box_insert" ON cash_box_sessions;
DROP POLICY IF EXISTS "cash_box_update" ON cash_box_sessions;
DROP POLICY IF EXISTS "cash_box_closures_select" ON cash_box_closures;
DROP POLICY IF EXISTS "cash_box_closures_manage" ON cash_box_closures;
DROP POLICY IF EXISTS "refunds_select" ON refunds;
DROP POLICY IF EXISTS "refunds_insert" ON refunds;
DROP POLICY IF EXISTS "settings_select" ON settings;
DROP POLICY IF EXISTS "settings_update_admin" ON settings;

CREATE POLICY "employees_tenant_select" ON employees
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "employees_tenant_insert" ON employees
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "employees_tenant_update" ON employees
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "employees_tenant_delete" ON employees
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin'])
  );

CREATE POLICY "products_tenant_select" ON products
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "products_tenant_insert" ON products
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "products_tenant_update" ON products
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "products_tenant_delete" ON products
  FOR DELETE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin'])
  );

CREATE POLICY "product_sizes_tenant_select" ON product_sizes
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "product_sizes_tenant_all" ON product_sizes
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

CREATE POLICY "customers_tenant_select" ON customers
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "customers_tenant_all" ON customers
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

CREATE POLICY "sales_tenant_select" ON sales
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "sales_tenant_insert" ON sales
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "sales_tenant_update" ON sales
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

CREATE POLICY "sale_items_tenant_select" ON sale_items
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "sale_items_tenant_insert" ON sale_items
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "cash_box_tenant_select" ON cash_box_sessions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cash_box_tenant_all" ON cash_box_sessions
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

CREATE POLICY "cash_box_closures_tenant_select" ON cash_box_closures
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cash_box_closures_tenant_all" ON cash_box_closures
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

CREATE POLICY "refunds_tenant_select" ON refunds
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "refunds_tenant_insert" ON refunds
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

CREATE POLICY "settings_tenant_select" ON settings
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "settings_tenant_update" ON settings
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin'])
  );

-- ============================================
-- PLAN LIMIT ENFORCEMENT FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION can_create_product(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM products WHERE tenant_id = p_tenant_id;
  SELECT max_products INTO max_allowed FROM tenants WHERE id = p_tenant_id;
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_add_employee(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count FROM employees WHERE tenant_id = p_tenant_id AND active = true;
  SELECT max_employees INTO max_allowed FROM tenants WHERE id = p_tenant_id;
  RETURN current_count < max_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PIN HASHING (Security)
-- ============================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM tenants) as tenants,
  (SELECT COUNT(*) FROM tenant_members) as members,
  (SELECT COUNT(*) FROM employees WHERE tenant_id IS NULL) as employees_no_tenant,
  (SELECT COUNT(*) FROM products WHERE tenant_id IS NULL) as products_no_tenant,
  (SELECT COUNT(*) FROM sales WHERE tenant_id IS NULL) as sales_no_tenant;
