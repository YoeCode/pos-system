-- ============================================
-- Casa Lis POS - Reset de datos de negocio
-- Ejecutar en Supabase SQL Editor
--
-- ESTE SCRIPT BORRA:
--   - productos y tallas
--   - clientes
--   - ventas y líneas de venta
--   - sesiones y cierres de caja
--   - devoluciones
--
-- ESTE SCRIPT CONSERVA:
--   - usuarios de autenticación (auth.users)
--   - tenants / empresas
--   - miembros de tenant (tenant_members)
--   - empleados
--   - configuración (settings), reseteada a valores por defecto
--
-- IMPORTANTE:
--   1. Haz un backup/export antes de ejecutar.
--   2. No borra imágenes de Supabase Storage; límpialas manualmente si es necesario.
--   3. Ejecuta dentro de una transacción (BEGIN/COMMIT ya incluidos).
-- ============================================

BEGIN;

-- 1. Tablas de detalle / hijas primero
DELETE FROM sale_items;
DELETE FROM refunds;
DELETE FROM product_sizes;

-- 2. Tablas de transacciones
DELETE FROM sales;
DELETE FROM cash_box_closures;
DELETE FROM cash_box_sessions;

-- 3. Tablas maestras de negocio
DELETE FROM products;
DELETE FROM customers;

-- 4. Resetear configuración a valores por defecto
UPDATE settings
SET store_name = 'Casa Lis',
    store_address = NULL,
    store_phone = NULL,
    store_email = NULL,
    receipt_footer = NULL,
    tax_rate = 0.21,
    tax_included = false,
    language = 'es',
    currency = 'EUR';

COMMIT;
