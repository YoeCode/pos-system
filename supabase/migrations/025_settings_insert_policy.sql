-- ============================================
-- Casa Lis POS - Allow tenants to create their settings row under RLS
--
-- Why: migration 001 created only SELECT and UPDATE policies on `settings`,
-- assuming the row would already exist for every tenant. But
-- `register_new_business` (SECURITY DEFINER) inserts only `tenants` and
-- `employees`, so a fresh tenant has NO `settings` row. The first settings
-- save from the UI (`upsertTenantSettings` in
-- src/features/settings/settingsService.ts -> INSERT ... ON CONFLICT
-- (tenant_id) DO UPDATE) hits the INSERT branch and is rejected by RLS:
-- without an INSERT policy, no role subject to RLS can insert. The app
-- silently runs on client defaults and the first save fails.
--
-- Fix: mirror the `sales_tenant_insert` / `products_tenant_insert` pattern
-- from migration 001 - an INSERT policy keyed on current_tenant_id(). The
-- upsert payload already carries `tenant_id`, which is the table's primary
-- key (migration 001, T1.4), so no client change is needed.
-- ============================================

DROP POLICY IF EXISTS "settings_tenant_insert" ON settings;

CREATE POLICY "settings_tenant_insert" ON settings
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

-- ============================================
-- SCHEMA AUDIT - same gap class (RLS-enabled public table with no INSERT
-- policy). Verified against the full migration chain (000-025):
--
--   table              INSERT policy?  who writes it
--   -----------------  --------------  -----------------------------------
--   settings           NO (fixed here) client: upsertTenantSettings
--   tenants            NO (acceptable) SECURITY DEFINER RPC
--                                      register_new_business only; the
--                                      client helper createTenant
--                                      (tenantsService.ts) is dead code,
--                                      never called.
--   employees          yes             client + SECURITY DEFINER RPCs
--   products           yes             client
--   customers          yes (FOR ALL)   client
--   sales              yes             client
--   sale_items         yes             client
--   cash_box_sessions  yes (FOR ALL)   client
--   cash_box_closures  yes (FOR ALL)   client
--   refunds            yes             client
--   invitations        yes             client
--   categories         yes (FOR ALL)   client
--   brands             yes (FOR ALL)   client
--   sizes              yes (FOR ALL)   client
--   size_groups        yes (FOR ALL)   client
--   seasons            yes (FOR ALL)   client + SECURITY DEFINER seed
--   sku_counters       yes (FOR ALL)   SECURITY DEFINER RPC next_sku
--   product_attributes yes (FOR ALL)   client
--   product_variants   yes (FOR ALL)   client + SECURITY DEFINER stock RPCs
--
-- The verification query below runs on every fresh reset and lists every
-- RLS-enabled public table with its INSERT policy status (pg_policies.cmd:
-- 'INSERT' or 'ALL' means INSERT is covered).
-- ============================================

SELECT c.relname AS table_name,
       EXISTS (
         SELECT 1 FROM pg_policies p
         WHERE p.schemaname = 'public'
           AND p.tablename = c.relname
           AND p.cmd IN ('INSERT', 'ALL')
       ) AS has_insert_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
ORDER BY 1;
