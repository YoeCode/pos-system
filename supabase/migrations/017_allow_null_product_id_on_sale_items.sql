-- ============================================
-- Casa Lis POS - Manual product lines on sale_items
-- Manual (non-catalog) products created at the POS never get a
-- products row, so their sale lines must be allowed to persist
-- without a product reference. Snapshot columns (product_name,
-- product_sku, product_category, product_subcategory, unit_price,
-- line_total) keep the line renderable on tickets and reports.
-- The foreign key stays: NULL passes FK validation, only non-NULL
-- values are checked against products(id).
-- ============================================

ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;
