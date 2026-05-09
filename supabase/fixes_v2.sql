DROP POLICY IF EXISTS "employees_select_active" ON employees;
CREATE POLICY "employees_select_active" ON employees
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_select_active" ON products;
CREATE POLICY "products_select_active" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "product_sizes_select" ON product_sizes;
CREATE POLICY "product_sizes_select" ON product_sizes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "customers_select" ON customers;
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sales_select" ON sales;
CREATE POLICY "sales_select" ON sales
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "sale_items_select" ON sale_items;
CREATE POLICY "sale_items_select" ON sale_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cash_box_select" ON cash_box_sessions;
CREATE POLICY "cash_box_select" ON cash_box_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "cash_box_closures_select" ON cash_box_closures;
CREATE POLICY "cash_box_closures_select" ON cash_box_closures
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "refunds_select" ON refunds;
CREATE POLICY "refunds_select" ON refunds
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_select" ON settings;
CREATE POLICY "settings_select" ON settings
  FOR SELECT USING (true);
