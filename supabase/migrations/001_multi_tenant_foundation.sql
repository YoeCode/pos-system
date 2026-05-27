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

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS: tenants readable by their members
DROP POLICY IF EXISTS "tenants_select_members" ON tenants;
CREATE POLICY "tenants_select_members" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_members tm
      WHERE tm.tenant_id = tenants.id AND tm.user_id = auth.uid()
    )
  );

-- RLS: tenants updatable by owner only
DROP POLICY IF EXISTS "tenants_update_owner" ON tenants;
CREATE POLICY "tenants_update_owner" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

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

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- RLS: members can see their own memberships
DROP POLICY IF EXISTS "tenant_members_select_own" ON tenant_members;
CREATE POLICY "tenant_members_select_own" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());

-- RLS: owner/admin can manage members of their tenant
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
-- T1.4: Refactor settings table for multi-tenant
-- --------------------------------------------
-- First, backfill existing settings with legacy tenant (done in T1.7)
-- Make tenant_id the primary key (one settings per tenant)
DO $$
BEGIN
  -- Only run if settings still has the old singleton structure
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'id'
    AND data_type = 'uuid'
  ) THEN
    -- Drop old primary key if it's the singleton ID
    ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
    -- Make tenant_id not null
    ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
    -- Set tenant_id as primary key
    ALTER TABLE settings ADD PRIMARY KEY (tenant_id);
    -- Drop old id column if it exists
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
  -- Try to get tenant_id from user_metadata in JWT
  BEGIN
    tenant_uuid := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    tenant_uuid := NULL;
  END;
  
  -- Fallback: get from tenant_members if single membership
  IF tenant_uuid IS NULL THEN
    SELECT tenant_id INTO tenant_uuid
    FROM tenant_members
    WHERE user_id = auth.uid()
    LIMIT 1;
  END IF;
  
  RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role in current tenant
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
-- T1.7: Create legacy tenant and backfill data
-- --------------------------------------------
-- Insert legacy tenant (idempotent)
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

-- Update slug if conflict
UPDATE tenants SET slug = 'casalis-legacy' WHERE id = 'f1d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2';

-- Backfill tenant_id on all existing data
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

-- Set legacy tenant owner to first admin employee with user_id
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

-- If no admin with user_id found, fallback to any employee with user_id
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
-- T1.8: Make tenant_id NOT NULL on all tables
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
-- settings already has NOT NULL from T1.4

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

-- Drop old single-tenant policies (they assume global access)
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

-- Employees: readable by all tenant members, manageable by admin+
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

-- Products: readable by all members, manageable by admin+
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

-- Product sizes: cascade with products
CREATE POLICY "product_sizes_tenant_select" ON product_sizes
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "product_sizes_tenant_all" ON product_sizes
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

-- Customers: readable by all, manageable by supervisor+
CREATE POLICY "customers_tenant_select" ON customers
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "customers_tenant_all" ON customers
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

-- Sales: readable by all tenant members, insert by any member
CREATE POLICY "sales_tenant_select" ON sales
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "sales_tenant_insert" ON sales
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "sales_tenant_update" ON sales
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

-- Sale items: cascade with sales
CREATE POLICY "sale_items_tenant_select" ON sale_items
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "sale_items_tenant_insert" ON sale_items
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- Cash box sessions: readable by all, manageable by supervisor+
CREATE POLICY "cash_box_tenant_select" ON cash_box_sessions
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cash_box_tenant_all" ON cash_box_sessions
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

-- Cash box closures: readable by all, manageable by supervisor+
CREATE POLICY "cash_box_closures_tenant_select" ON cash_box_closures
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "cash_box_closures_tenant_all" ON cash_box_closures
  FOR ALL USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

-- Refunds: readable by all, insert by supervisor+
CREATE POLICY "refunds_tenant_select" ON refunds
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "refunds_tenant_insert" ON refunds
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager', 'supervisor'])
  );

-- Settings: one per tenant
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
-- Add pin_hash column if not exists
ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Migrate existing plain PINs to hashed (using bcrypt)
-- Note: pgcrypto must be enabled (already is via uuid-ossp)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM employees WHERE pin IS NOT NULL AND pin_hash IS NULL LIMIT 1) THEN
    -- We can't hash in pure SQL easily without pgcrypto crypt function
    -- This should be done via Edge Function or manual update
    -- For now, add column and leave migration for Phase 2
    NULL;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify after execution:
-- SELECT 
--   (SELECT COUNT(*) FROM tenants) as tenants,
--   (SELECT COUNT(*) FROM tenant_members) as members,
--   (SELECT COUNT(*) FROM employees WHERE tenant_id IS NULL) as employees_no_tenant,
--   (SELECT COUNT(*) FROM products WHERE tenant_id IS NULL) as products_no_tenant,
--   (SELECT COUNT(*) FROM sales WHERE tenant_id IS NULL) as sales_no_tenant;
