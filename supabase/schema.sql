CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('cashier', 'supervisor', 'manager', 'admin')),
  pin TEXT,
  phone TEXT,
  shift TEXT,
  terminal_id TEXT,
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  size_group_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  sku TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size)
);

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

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
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

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  product_category TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  selected_size TEXT
);

CREATE TABLE cash_box_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opened_by UUID REFERENCES employees(id),
  employee_ids UUID[] NOT NULL DEFAULT '{}',
  terminal_id TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true
);

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

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id),
  employee_id UUID REFERENCES employees(id),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  pin_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

INSERT INTO settings (id) VALUES ('00000000-0000-0000-0000-000000000000');

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

CREATE POLICY "employees_select_active" ON employees
  FOR SELECT USING (active = true);

CREATE POLICY "employees_manage_admin" ON employees
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (status = 'active');

CREATE POLICY "products_manage" ON products
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "product_sizes_select" ON product_sizes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products p WHERE p.id = product_sizes.product_id AND p.status = 'active'
    )
  );

CREATE POLICY "product_sizes_manage" ON product_sizes
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (active = true);

CREATE POLICY "customers_manage" ON customers
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (true);

CREATE POLICY "sales_insert_own" ON sales
  FOR INSERT WITH CHECK (
    employee_id IS NULL OR employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (true);

CREATE POLICY "sale_items_insert" ON sale_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cash_box_select" ON cash_box_sessions
  FOR SELECT USING (true);

CREATE POLICY "cash_box_insert" ON cash_box_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "cash_box_update" ON cash_box_sessions
  FOR UPDATE USING (true);

CREATE POLICY "cash_box_closures_select" ON cash_box_closures
  FOR SELECT USING (true);

CREATE POLICY "cash_box_closures_manage" ON cash_box_closures
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

CREATE POLICY "refunds_select" ON refunds
  FOR SELECT USING (true);

CREATE POLICY "refunds_insert" ON refunds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role IN ('supervisor', 'manager', 'admin')
    )
  );

CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (true);

CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid() AND e.role = 'admin'
    )
  );

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

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
