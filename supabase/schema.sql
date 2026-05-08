-- ============================================================
-- Casa Lis POS - Supabase Database Schema
-- Execute this in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- EMPLOYEES TABLE
-- Links to auth.users for login, stores role and POS data
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('cashier', 'supervisor', 'manager', 'admin')),
  pin TEXT,
  phone TEXT,
  shift TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  brand TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  published_online BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCT SIZES (for products with variants)
-- ============================================================
CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  sku TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size)
);

-- ============================================================
-- CUSTOMERS (with loyalty program)
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALES TABLE
-- ============================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bizum')),
  amount_received NUMERIC(10,2),
  change NUMERIC(10,2),
  employee_id UUID REFERENCES employees(id),
  terminal_id TEXT,
  customer_id UUID REFERENCES customers(id),
  loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
  loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SALE ITEMS (line items per sale)
-- ============================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  selected_size TEXT
);

-- ============================================================
-- CASH BOX SESSIONS (open/close tracking)
-- ============================================================
CREATE TABLE cash_box_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by UUID REFERENCES employees(id),
  employee_ids UUID[] NOT NULL DEFAULT '{}',
  terminal_id TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- CASH BOX CLOSURES (audit trail / arqueo)
-- ============================================================
CREATE TABLE cash_box_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES cash_box_sessions(id) ON DELETE CASCADE,
  cash_expected NUMERIC(10,2) NOT NULL DEFAULT 0,
  cash_counted NUMERIC(10,2) NOT NULL DEFAULT 0,
  card_expected NUMERIC(10,2) NOT NULL DEFAULT 0,
  card_counted NUMERIC(10,2) NOT NULL DEFAULT 0,
  bizum_expected NUMERIC(10,2) NOT NULL DEFAULT 0,
  bizum_counted NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_difference NUMERIC(10,2) NOT NULL DEFAULT 0,
  closed_by UUID REFERENCES employees(id),
  pin_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REFUNDS
-- ============================================================
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  employee_id UUID REFERENCES employees(id),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  pin_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SETTINGS (singleton table - one row)
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_name TEXT NOT NULL DEFAULT 'Casa Lis',
  store_address TEXT,
  store_phone TEXT,
  store_email TEXT,
  receipt_footer TEXT,
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.21,
  tax_included BOOLEAN NOT NULL DEFAULT false,
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('en', 'es')),
  currency TEXT NOT NULL DEFAULT 'EUR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (id) VALUES ('00000000-0000-0000-0000-000000000000');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_sales_completed_at ON sales(completed_at DESC);
CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_terminal_id ON sales(terminal_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_cash_box_sessions_is_open ON cash_box_sessions(is_open);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_active ON employees(active);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_box_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_box_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- EMPLOYEES: authenticated users can view active employees
CREATE POLICY "employees_select_active" ON employees
  FOR SELECT USING (active = true);

-- Only managers and admins can insert/update employees
CREATE POLICY "employees_manage_admin" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

-- PRODUCTS: all authenticated can view active products
CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (status = 'active');

-- Managers/admins can manage products
CREATE POLICY "products_manage" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

-- PRODUCT SIZES: viewable if parent product is active
CREATE POLICY "product_sizes_select" ON product_sizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p WHERE p.id = product_sizes.product_id AND p.status = 'active'
    )
  );

-- CUSTOMERS: all authenticated can view
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (active = true);

-- Supervisors+ can manage customers
CREATE POLICY "customers_manage" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

-- SALES: all authenticated can view (for reports)
CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (true);

-- Cashiers can insert sales (their own)
CREATE POLICY "sales_insert_own" ON sales
  FOR INSERT WITH CHECK (
    employee_id = (
      SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- SALE ITEMS: viewable by parent sale
CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (true);

-- CASH BOX SESSIONS: viewable by all
CREATE POLICY "cash_box_select" ON cash_box_sessions
  FOR SELECT USING (true);

-- REFUNDS: viewable by all
CREATE POLICY "refunds_select" ON refunds
  FOR SELECT USING (true);

-- SETTINGS: readable by all, writable by admin only
CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role = 'admin'
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at on settings
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REALTIME PUBLICATIONS (for live sync)
-- ============================================================

-- Create publication for realtime (Supabase Realtime)
-- You need to run this in Supabase Dashboard > Database > Replication > Add Table
-- Or enable via SQL if you have permissions:
-- CREATE PUBLICATION supabase_realtime FOR TABLE sales, cash_box_sessions, products;

-- ============================================================
-- SEED DATA (optional - for testing)
-- ============================================================

-- Insert sample products (uncomment to use)
/*
INSERT INTO products (name, sku, category, brand, price, cost_price, stock, min_stock, description, status, published_online)
VALUES
  ('Summit Pro Watch', 'WT-992-SMT', 'Electronics', 'TechFit', 299, 180, 142, 20, 'Premium smartwatch', 'active', true),
  ('AudioCore Wireless', 'AD-402-WRL', 'Electronics', 'SoundPro', 189, 95, 8, 10, 'Wireless headphones', 'active', true);
*/

-- Insert sample customers
/*
INSERT INTO customers (name, email, phone, loyalty_points, tier, total_spent)
VALUES
  ('María García', 'maria@example.es', '+34 600 111 222', 120, 'bronze', 120),
  ('Carlos Ruiz', 'carlos@example.es', '+34 600 222 333', 780, 'silver', 780);
*/
