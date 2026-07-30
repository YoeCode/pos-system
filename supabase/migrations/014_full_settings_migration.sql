-- ============================================
-- Casa Lis POS - Full Settings Persistence Migration
-- Extend existing settings table to hold all tenant config
-- ============================================

-- --------------------------------------------
-- S2.1: Add missing columns to settings table
-- --------------------------------------------
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS tax_name TEXT DEFAULT 'Tax',
  ADD COLUMN IF NOT EXISTS tax_registration_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pos_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS loyalty_config JSONB DEFAULT '{"enabled": true, "points_per_euro": 1, "tiers": [{"tier": "bronze", "threshold": 0, "discount_pct": 0}, {"tier": "silver", "threshold": 500, "discount_pct": 0.05}, {"tier": "gold", "threshold": 1500, "discount_pct": 0.10}, {"tier": "platinum", "threshold": 5000, "discount_pct": 0.15}]}';

-- Ensure updated_at auto-updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------
-- S2.2: Upsert default settings row for each tenant
-- --------------------------------------------
INSERT INTO settings (tenant_id, currency, language, store_name, receipt_footer, tax_rate, tax_included, tax_name, tax_registration_number, pos_config, loyalty_config)
SELECT
  t.id,
  'EUR',
  'es',
  t.name,
  'Thank you!',
  0.21,
  false,
  'Tax',
  '',
  '{"default_payment_method": "cash", "default_category": "All Items", "walk_in_customer_label": "Walk-In Customer", "order_number_prefix": "ORD-", "order_number_seed": 1042, "enable_manual_product": true, "multi_terminal_mode": false, "enable_ai_delivery_note": false, "ticket_config": {"show_logo": false, "show_employee": true, "show_store_name": true}, "max_sale_windows": 5, "refund_settings": {"enabled": true, "require_pin": true, "pin_threshold": 50, "max_refund_days": 30}, "ticket_size": "58mm", "shifts": ["Mañana 06:00-14:00", "Tarde 14:00-22:00", "Noche 22:00-06:00", "Jornada completa 08:00-18:00"]}'::jsonb,
  '{"enabled": true, "points_per_euro": 1, "tiers": [{"tier": "bronze", "threshold": 0, "discount_pct": 0}, {"tier": "silver", "threshold": 500, "discount_pct": 0.05}, {"tier": "gold", "threshold": 1500, "discount_pct": 0.10}, {"tier": "platinum", "threshold": 5000, "discount_pct": 0.15}]}'::jsonb
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM settings s WHERE s.tenant_id = t.id
);

-- --------------------------------------------
-- S2.3: Update existing settings rows with defaults for new columns
-- --------------------------------------------
UPDATE settings
SET tax_name = COALESCE(tax_name, 'Tax'),
    tax_registration_number = COALESCE(tax_registration_number, ''),
    pos_config = COALESCE(pos_config, '{"default_payment_method": "cash", "default_category": "All Items", "walk_in_customer_label": "Walk-In Customer", "order_number_prefix": "ORD-", "order_number_seed": 1042, "enable_manual_product": true, "multi_terminal_mode": false, "enable_ai_delivery_note": false, "ticket_config": {"show_logo": false, "show_employee": true, "show_store_name": true}, "max_sale_windows": 5, "refund_settings": {"enabled": true, "require_pin": true, "pin_threshold": 50, "max_refund_days": 30}, "ticket_size": "58mm", "shifts": ["Mañana 06:00-14:00", "Tarde 14:00-22:00", "Noche 22:00-06:00", "Jornada completa 08:00-18:00"]}'::jsonb),
    loyalty_config = COALESCE(loyalty_config, '{"enabled": true, "points_per_euro": 1, "tiers": [{"tier": "bronze", "threshold": 0, "discount_pct": 0}, {"tier": "silver", "threshold": 500, "discount_pct": 0.05}, {"tier": "gold", "threshold": 1500, "discount_pct": 0.10}, {"tier": "platinum", "threshold": 5000, "discount_pct": 0.15}]}'::jsonb)
WHERE pos_config IS NULL OR loyalty_config IS NULL;
