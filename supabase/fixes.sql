-- ============================================================
-- Schema Fixes for Casa Lis POS
-- Run this AFTER schema.sql if you already executed it
-- Or run both together if starting fresh
-- ============================================================

-- ============================================================
-- MISSING COLUMNS
-- ============================================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS terminal_id TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_group_id TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ============================================================
-- FIX RLS POLICIES (drop + recreate with correct scope)
-- ============================================================

DROP POLICY IF EXISTS "employees_manage_admin" ON employees;
CREATE POLICY "employees_manage_admin" ON employees
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "products_manage" ON products;
CREATE POLICY "products_manage" ON products
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "customers_manage" ON customers;
CREATE POLICY "customers_manage" ON customers
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "sales_insert_own" ON sales;
CREATE POLICY "sales_insert_own" ON sales
  FOR INSERT WITH CHECK (
    employee_id IS NULL OR employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- ADD MISSING INSERT POLICIES
-- ============================================================

DROP POLICY IF EXISTS "sale_items_insert" ON sale_items;
CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "product_sizes_manage" ON product_sizes;
CREATE POLICY "product_sizes_manage" ON product_sizes
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "cash_box_insert" ON cash_box_sessions;
CREATE POLICY "cash_box_insert" ON cash_box_sessions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "cash_box_update" ON cash_box_sessions;
CREATE POLICY "cash_box_update" ON cash_box_sessions
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "cash_box_closures_manage" ON cash_box_closures;
CREATE POLICY "cash_box_closures_manage" ON cash_box_closures
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "refunds_insert" ON refunds;
CREATE POLICY "refunds_insert" ON refunds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

-- ============================================================
-- SEED DATA: Insert sample products
-- ============================================================

INSERT INTO products (id, name, sku, category, brand, price, cost_price, stock, min_stock, description, status, published_online)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Summit Pro Watch', 'WT-992-SMT', 'Electronics', 'TechFit', 299, 180, 142, 20, 'Premium smartwatch with advanced fitness tracking and GPS.', 'active', true),
  ('22222222-2222-2222-2222-222222222222', 'AudioCore Wireless', 'AD-402-WRL', 'Electronics', 'SoundPro', 189, 95, 8, 10, 'High-fidelity wireless headphones with active noise cancellation.', 'active', true),
  ('33333333-3333-3333-3333-333333333333', 'Camiseta Básica', 'CB-001-BAS', 'Apparel', 'Casa Lis', 25, 12, 0, 20, 'Camiseta básica de algodón.', 'active', true),
  ('44444444-4444-4444-4444-444444444444', 'Chocolate Glazed', 'CG-001', 'Food', 'FreshBakery', 4.50, 1.20, 200, 30, 'Classic chocolate glazed donut, freshly baked daily.', 'active', false),
  ('55555555-5555-5555-5555-555555555555', 'Caramel Iced Latte', 'CL-002', 'Drinks', 'BeanHouse', 5.25, 1.80, 150, 20, 'Creamy caramel iced latte with oat milk option.', 'active', false)
ON CONFLICT (id) DO NOTHING;

-- Insert sizes for Camiseta Básica
INSERT INTO product_sizes (product_id, size, stock, min_stock)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'S', 15, 5),
  ('33333333-3333-3333-3333-333333333333', 'M', 8, 5),
  ('33333333-3333-3333-3333-333333333333', 'L', 3, 5),
  ('33333333-3333-3333-3333-333333333333', 'XL', 0, 5)
ON CONFLICT (product_id, size) DO NOTHING;

-- ============================================================
-- SEED DATA: Insert sample customers
-- ============================================================

INSERT INTO customers (id, name, email, phone, loyalty_points, tier, total_spent)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'María García', 'maria@example.es', '+34 600 111 222', 120, 'bronze', 120),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Carlos Ruiz', 'carlos@example.es', '+34 600 222 333', 780, 'silver', 780)
ON CONFLICT (id) DO NOTHING;
