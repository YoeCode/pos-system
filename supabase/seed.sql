-- ============================================
-- Casa Lis POS - Seed Data (Idempotente)
-- Ejecutar en Supabase SQL Editor tras schema.sql
-- ============================================

-- --------------------------------------------
-- EMPLOYEES
-- --------------------------------------------
INSERT INTO employees (id, name, email, role, pin, phone, shift, active, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ana Martínez', 'admin@casalis.com', 'admin', '1234', '+34 555 0101', 'Morning 06:00-14:00', true, '2023-03-15 08:00:00+00'),
  ('22222222-2222-2222-2222-222222222222', 'Carlos López', 'manager@casalis.com', 'manager', '2345', '+34 555 0102', 'Evening 14:00-22:00', true, '2022-07-01 08:00:00+00'),
  ('33333333-3333-3333-3333-333333333333', 'María García', 'supervisor@casalis.com', 'supervisor', '3456', '+34 555 0103', 'Morning 06:00-14:00', true, '2021-01-10 08:00:00+00'),
  ('44444444-4444-4444-4444-444444444444', 'Juan Rodríguez', 'cashier@casalis.com', 'cashier', '4567', '+34 555 0104', 'Night 22:00-06:00', true, '2023-09-20 08:00:00+00'),
  ('55555555-5555-5555-5555-555555555555', 'Laura Fernández', 'cashier2@casalis.com', 'cashier', '5678', '+34 555 0105', 'Morning 06:00-14:00', true, '2024-01-15 08:00:00+00')
ON CONFLICT (email) DO NOTHING;

-- --------------------------------------------
-- PRODUCTS (insert or update to ensure IDs match)
-- --------------------------------------------
INSERT INTO products (id, name, sku, category, brand, price, cost_price, stock, min_stock, status, published_online, description, created_at, updated_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Summit Pro Watch', 'WT-992-SMT', 'Electronics', 'TechFit', 299.00, 180.00, 142, 20, 'active', true, 'Premium smartwatch with advanced fitness tracking and GPS.', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'AudioCore Wireless', 'AD-402-WRL', 'Electronics', 'SoundPro', 189.00, 95.00, 8, 10, 'active', true, 'High-fidelity wireless headphones with active noise cancellation.', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'Velocity Runner X', 'FT-881-VRX', 'Apparel', 'RunFast', 125.00, 60.00, 56, 10, 'active', true, 'Professional running shoes with carbon fiber sole.', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', 'Chocolate Glazed', 'CG-001', 'Food', 'FreshBakery', 4.50, 1.20, 200, 30, 'active', false, 'Classic chocolate glazed donut, freshly baked daily.', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', 'Caramel Iced Latte', 'CL-002', 'Drinks', 'BeanHouse', 5.25, 1.80, 150, 20, 'active', false, 'Creamy caramel iced latte with oat milk option.', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666666', 'Classic Cheeseburger', 'CB-003', 'Food', 'GrillHouse', 12.00, 4.50, 80, 15, 'active', false, 'Juicy beef patty with cheddar cheese, lettuce, and tomato.', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777777', 'Artisan Lime Soda', 'ALS-004', 'Drinks', 'FizzCo', 3.75, 0.90, 120, 15, 'active', false, 'Refreshing artisan sparkling soda with natural lime flavor.', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888888', 'Avocado Brunch', 'AVB-005', 'Food', 'GreenKitchen', 14.50, 6.00, 45, 10, 'active', false, 'Toasted sourdough with smashed avocado, poached eggs, and chili flakes.', NOW(), NOW()),
  ('a9999999-9999-9999-9999-999999999999', 'Camiseta Básica', 'CB-001-BAS', 'Apparel', 'Casa Lis', 25.00, 12.00, 0, 20, 'active', true, 'Camiseta básica de algodón.', NOW(), NOW()),
  ('b0000000-0000-0000-0000-000000000000', 'Sujetador Everyday', 'SUJ-EVY-01', 'Lencería', 'Casa Lis', 35.00, 15.00, 0, 30, 'active', true, 'Sujetador everyday suave.', NOW(), NOW()),
  ('b1111111-1111-1111-1111-111111111111', 'Pantalón Classic', 'PNT-CLS-01', 'Apparel', 'Casa Lis', 45.00, 20.00, 0, 15, 'active', true, 'Pantalón classic tela elástica.', NOW(), NOW()),
  ('b2222222-2222-2222-2222-222222222222', 'Vestido Floral', 'VST-FLR-01', 'Apparel', 'Casa Lis', 55.00, 25.00, 0, 10, 'active', true, 'Vestido floral primavera.', NOW(), NOW()),
  ('b3333333-3333-3333-3333-333333333333', 'Braguita Cotton', 'BRG-CTN-01', 'Lencería', 'Casa Lis', 12.00, 5.00, 0, 50, 'active', true, 'Braguita algodón suave.', NOW(), NOW()),
  ('b4444444-4444-4444-4444-444444444444', 'SmartHome Hub', 'SH-001', 'Electronics', 'HomeTech', 149.00, 85.00, 32, 8, 'active', true, 'Central smart home controller compatible with Alexa and Google Home.', NOW(), NOW()),
  ('b5555555-5555-5555-5555-555555555555', 'Organic Green Tea', 'TEA-001', 'Drinks', 'NatureLeaf', 6.50, 2.50, 85, 15, 'active', false, 'Premium organic green tea imported from Japan.', NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  cost_price = EXCLUDED.cost_price,
  stock = EXCLUDED.stock,
  min_stock = EXCLUDED.min_stock,
  status = EXCLUDED.status,
  published_online = EXCLUDED.published_online,
  description = EXCLUDED.description,
  updated_at = NOW();

-- --------------------------------------------
-- PRODUCT SIZES (lookup product IDs dynamically)
-- --------------------------------------------
INSERT INTO product_sizes (product_id, size, stock, min_stock, sku)
SELECT id, 'S', 15, 5, 'CB-001-BAS-S' FROM products WHERE sku = 'CB-001-BAS'
UNION ALL SELECT id, 'M', 8, 5, 'CB-001-BAS-M' FROM products WHERE sku = 'CB-001-BAS'
UNION ALL SELECT id, 'L', 3, 5, 'CB-001-BAS-L' FROM products WHERE sku = 'CB-001-BAS'
UNION ALL SELECT id, 'XL', 0, 5, 'CB-001-BAS-XL' FROM products WHERE sku = 'CB-001-BAS'
UNION ALL SELECT id, '80A', 5, 3, 'SUJ-EVY-80A' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '80B', 8, 3, 'SUJ-EVY-80B' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '85A', 12, 3, 'SUJ-EVY-85A' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '85B', 6, 3, 'SUJ-EVY-85B' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '90A', 2, 3, 'SUJ-EVY-90A' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '90B', 0, 3, 'SUJ-EVY-90B' FROM products WHERE sku = 'SUJ-EVY-01'
UNION ALL SELECT id, '38', 4, 3, 'PNT-CLS-38' FROM products WHERE sku = 'PNT-CLS-01'
UNION ALL SELECT id, '40', 6, 3, 'PNT-CLS-40' FROM products WHERE sku = 'PNT-CLS-01'
UNION ALL SELECT id, '42', 2, 3, 'PNT-CLS-42' FROM products WHERE sku = 'PNT-CLS-01'
UNION ALL SELECT id, '44', 0, 3, 'PNT-CLS-44' FROM products WHERE sku = 'PNT-CLS-01'
UNION ALL SELECT id, 'XS', 3, 2, 'VST-FLR-XS' FROM products WHERE sku = 'VST-FLR-01'
UNION ALL SELECT id, 'S', 7, 2, 'VST-FLR-S' FROM products WHERE sku = 'VST-FLR-01'
UNION ALL SELECT id, 'M', 10, 2, 'VST-FLR-M' FROM products WHERE sku = 'VST-FLR-01'
UNION ALL SELECT id, 'L', 5, 2, 'VST-FLR-L' FROM products WHERE sku = 'VST-FLR-01'
UNION ALL SELECT id, 'XL', 1, 2, 'VST-FLR-XL' FROM products WHERE sku = 'VST-FLR-01'
UNION ALL SELECT id, 'S', 20, 10, 'BRG-CTN-S' FROM products WHERE sku = 'BRG-CTN-01'
UNION ALL SELECT id, 'M', 25, 10, 'BRG-CTN-M' FROM products WHERE sku = 'BRG-CTN-01'
UNION ALL SELECT id, 'L', 15, 10, 'BRG-CTN-L' FROM products WHERE sku = 'BRG-CTN-01'
UNION ALL SELECT id, 'XL', 8, 10, 'BRG-CTN-XL' FROM products WHERE sku = 'BRG-CTN-01'
ON CONFLICT (product_id, size) DO NOTHING;

-- --------------------------------------------
-- CUSTOMERS
-- --------------------------------------------
INSERT INTO customers (id, name, email, phone, notes, active, loyalty_points, tier, total_spent, created_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'María García', 'maria.garcia@example.es', '+34 600 111 222', '', true, 120, 'bronze', 120.00, '2024-12-10 10:00:00+00'),
  ('c2222222-2222-2222-2222-222222222222', 'Carlos Ruiz', 'carlos.ruiz@example.es', '+34 600 222 333', 'Prefers email receipts', true, 780, 'silver', 780.00, '2024-08-22 10:00:00+00'),
  ('c3333333-3333-3333-3333-333333333333', 'Lucía Fernández', 'lucia.fernandez@example.es', '+34 600 333 444', '', true, 2340, 'gold', 2340.00, '2024-03-15 10:00:00+00'),
  ('c4444444-4444-4444-4444-444444444444', 'Javier Moreno', 'javier.moreno@example.es', '+34 600 444 555', 'VIP - birthday: Mar 4', true, 6180, 'platinum', 6180.00, '2023-11-02 10:00:00+00'),
  ('c5555555-5555-5555-5555-555555555555', 'Ana Torres', 'ana.torres@example.es', '+34 600 555 666', '', true, 0, 'bronze', 0.00, '2025-04-01 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------
-- SALES (seed transactions for realistic reporting)
-- --------------------------------------------
INSERT INTO sales (id, order_number, subtotal, tax, total, discount, payment_method, amount_received, change, employee_id, terminal_id, customer_id, loyalty_points_earned, loyalty_points_redeemed, completed_at, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'ORD-1041', 307.50, 64.58, 372.08, 0.00, 'card', 372.08, 0.00, (SELECT id FROM employees WHERE email = 'admin@casalis.com'), 'T01', (SELECT id FROM customers WHERE email = 'maria.garcia@example.es'), 372, 0, '2025-05-25 14:30:00+00', '2025-05-25 14:30:00+00'),
  ('d2222222-2222-2222-2222-222222222222', 'ORD-1040', 15.75, 3.31, 19.06, 0.00, 'cash', 20.00, 0.94, (SELECT id FROM employees WHERE email = 'manager@casalis.com'), 'T01', (SELECT id FROM customers WHERE email = 'carlos.ruiz@example.es'), 19, 0, '2025-05-25 13:15:00+00', '2025-05-25 13:15:00+00'),
  ('d3333333-3333-3333-3333-333333333333', 'ORD-1039', 131.25, 27.56, 158.81, 0.00, 'bizum', 158.81, 0.00, (SELECT id FROM employees WHERE email = 'admin@casalis.com'), 'T01', NULL, 0, 0, '2025-05-25 11:45:00+00', '2025-05-25 11:45:00+00'),
  ('d4444444-4444-4444-4444-444444444444', 'ORD-1038', 29.00, 6.09, 35.09, 0.00, 'card', 35.09, 0.00, (SELECT id FROM employees WHERE email = 'supervisor@casalis.com'), 'T02', (SELECT id FROM customers WHERE email = 'lucia.fernandez@example.es'), 35, 0, '2025-05-24 18:20:00+00', '2025-05-24 18:20:00+00'),
  ('d5555555-5555-5555-5555-555555555555', 'ORD-1037', 189.00, 39.69, 228.69, 0.00, 'cash', 230.00, 1.31, (SELECT id FROM employees WHERE email = 'manager@casalis.com'), 'T01', NULL, 0, 0, '2025-05-24 16:00:00+00', '2025-05-24 16:00:00+00'),
  ('d6666666-6666-6666-6666-666666666666', 'ORD-1036', 36.75, 7.72, 44.47, 0.00, 'card', 44.47, 0.00, (SELECT id FROM employees WHERE email = 'admin@casalis.com'), 'T01', (SELECT id FROM customers WHERE email = 'javier.moreno@example.es'), 44, 0, '2025-05-24 12:10:00+00', '2025-05-24 12:10:00+00'),
  ('d7777777-7777-7777-7777-777777777777', 'ORD-1035', 299.00, 62.79, 361.79, 0.00, 'bizum', 361.79, 0.00, (SELECT id FROM employees WHERE email = 'cashier@casalis.com'), 'T01', NULL, 0, 0, '2025-05-23 20:45:00+00', '2025-05-23 20:45:00+00'),
  ('d8888888-8888-8888-8888-888888888888', 'ORD-1034', 153.50, 32.24, 185.74, 0.00, 'cash', 190.00, 4.26, (SELECT id FROM employees WHERE email = 'supervisor@casalis.com'), 'T02', (SELECT id FROM customers WHERE email = 'carlos.ruiz@example.es'), 186, 0, '2025-05-23 15:30:00+00', '2025-05-23 15:30:00+00'),
  ('d9999999-9999-9999-9999-999999999999', 'ORD-1033', 15.00, 3.15, 18.15, 0.00, 'card', 18.15, 0.00, (SELECT id FROM employees WHERE email = 'manager@casalis.com'), 'T01', NULL, 0, 0, '2025-05-23 09:00:00+00', '2025-05-23 09:00:00+00'),
  ('d0000000-0000-0000-0000-000000000000', 'ORD-1032', 197.50, 41.48, 238.98, 0.00, 'cash', 240.00, 1.02, (SELECT id FROM employees WHERE email = 'admin@casalis.com'), 'T01', (SELECT id FROM customers WHERE email = 'maria.garcia@example.es'), 239, 0, '2025-05-22 19:00:00+00', '2025-05-22 19:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------
-- SALE ITEMS (lookup product IDs dynamically)
-- --------------------------------------------
INSERT INTO sale_items (sale_id, product_id, product_name, product_sku, product_category, quantity, unit_price, line_total, selected_size)
SELECT 'd1111111-1111-1111-1111-111111111111'::uuid, id, 'Summit Pro Watch', 'WT-992-SMT', 'Electronics', 1, 299.00, 299.00, NULL FROM products WHERE sku = 'WT-992-SMT'
UNION ALL SELECT 'd1111111-1111-1111-1111-111111111111'::uuid, id, 'Chocolate Glazed', 'CG-001', 'Food', 2, 4.50, 9.00, NULL FROM products WHERE sku = 'CG-001'
UNION ALL SELECT 'd2222222-2222-2222-2222-222222222222'::uuid, id, 'Caramel Iced Latte', 'CL-002', 'Drinks', 3, 5.25, 15.75, NULL FROM products WHERE sku = 'CL-002'
UNION ALL SELECT 'd3333333-3333-3333-3333-333333333333'::uuid, id, 'Velocity Runner X', 'FT-881-VRX', 'Apparel', 1, 125.00, 125.00, NULL FROM products WHERE sku = 'FT-881-VRX'
UNION ALL SELECT 'd3333333-3333-3333-3333-333333333333'::uuid, id, 'Artisan Lime Soda', 'ALS-004', 'Drinks', 2, 3.75, 7.50, NULL FROM products WHERE sku = 'ALS-004'
UNION ALL SELECT 'd4444444-4444-4444-4444-444444444444'::uuid, id, 'Avocado Brunch', 'AVB-005', 'Food', 2, 14.50, 29.00, NULL FROM products WHERE sku = 'AVB-005'
UNION ALL SELECT 'd5555555-5555-5555-5555-555555555555'::uuid, id, 'AudioCore Wireless', 'AD-402-WRL', 'Electronics', 1, 189.00, 189.00, NULL FROM products WHERE sku = 'AD-402-WRL'
UNION ALL SELECT 'd6666666-6666-6666-6666-666666666666'::uuid, id, 'Chocolate Glazed', 'CG-001', 'Food', 5, 4.50, 22.50, NULL FROM products WHERE sku = 'CG-001'
UNION ALL SELECT 'd6666666-6666-6666-6666-666666666666'::uuid, id, 'Caramel Iced Latte', 'CL-002', 'Drinks', 3, 5.25, 15.75, NULL FROM products WHERE sku = 'CL-002'
UNION ALL SELECT 'd7777777-7777-7777-7777-777777777777'::uuid, id, 'Summit Pro Watch', 'WT-992-SMT', 'Electronics', 1, 299.00, 299.00, NULL FROM products WHERE sku = 'WT-992-SMT'
UNION ALL SELECT 'd8888888-8888-8888-8888-888888888888'::uuid, id, 'Velocity Runner X', 'FT-881-VRX', 'Apparel', 2, 125.00, 250.00, NULL FROM products WHERE sku = 'FT-881-VRX'
UNION ALL SELECT 'd8888888-8888-8888-8888-888888888888'::uuid, id, 'Avocado Brunch', 'AVB-005', 'Food', 1, 14.50, 14.50, NULL FROM products WHERE sku = 'AVB-005'
UNION ALL SELECT 'd9999999-9999-9999-9999-999999999999'::uuid, id, 'Artisan Lime Soda', 'ALS-004', 'Drinks', 4, 3.75, 15.00, NULL FROM products WHERE sku = 'ALS-004'
UNION ALL SELECT 'd0000000-0000-0000-0000-000000000000'::uuid, id, 'AudioCore Wireless', 'AD-402-WRL', 'Electronics', 1, 189.00, 189.00, NULL FROM products WHERE sku = 'AD-402-WRL'
UNION ALL SELECT 'd0000000-0000-0000-0000-000000000000'::uuid, id, 'Caramel Iced Latte', 'CL-002', 'Drinks', 2, 5.25, 10.50, NULL FROM products WHERE sku = 'CL-002'
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------
-- CASH BOX SESSION (one open session for demo)
-- --------------------------------------------
INSERT INTO cash_box_sessions (id, opened_at, opened_by, employee_ids, terminal_id, is_open) VALUES
  ('cb111111-1111-1111-1111-111111111111', '2025-05-26 06:00:00+00', (SELECT id FROM employees WHERE email = 'admin@casalis.com'), ARRAY[(SELECT id FROM employees WHERE email = 'admin@casalis.com'), (SELECT id FROM employees WHERE email = 'cashier@casalis.com')]::uuid[], 'T01', true)
ON CONFLICT (id) DO NOTHING;
