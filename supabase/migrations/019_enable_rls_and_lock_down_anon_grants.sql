-- =====================================================================
-- 019: Enable RLS and lock down anon privileges
-- =====================================================================
-- Purpose:
--   Finish the security lockdown tracked in issue #31.
--   1. Enable Row Level Security on employees, products, sales and
--      sale_items. Their *_tenant_* policies (migration 001) already
--      exist in the database but were inert because RLS was disabled on
--      these four tables, letting any logged-in user read and write
--      cross-tenant data.
--   2. Revoke every anon privilege on the 20 public tables and restore
--      only the minimal pre-auth SELECT carve-out justified by a flow
--      analysis of the public (pre-auth) UI.
--
-- Date: 2026-11-10
--
-- Evidence (verified against production 2026-11-10):
--   - RLS disabled on: employees, products, sales, sale_items.
--     customers and every other public table already have RLS enabled.
--   - anon INSERT/UPDATE/DELETE/TRUNCATE on 20 public tables was
--     revoked in production by the recorded hotfix
--     `hotfix_revoke_anon_write_privileges`. That hotfix is NOT in this
--     repository, so this migration restates the revokes to make them
--     durable on fresh environments. anon kept SELECT grants; this
--     migration removes those too, except for the carve-out below.
--
-- Pre-auth (anon) flow analysis:
--   LandingPage (/)          -> NO database reads (static page).
--   LoginPage (/login)       -> Supabase Auth only (no table reads).
--   RegisterPage (/register) -> RPC register_new_business
--                              (SECURITY DEFINER; needs no table grants).
--   AcceptInvitePage         -> SELECT on invitations via
--                              getInvitationByToken(): rows scoped by
--                              token + status='pending' + expires_at > now()
--                              (RLS policy "invitations_select_by_token").
--                              Reads all columns (select('*')).
--                              Then RPC complete_invitation_acceptance
--                              (SECURITY DEFINER; needs no table grants).
--
--   => The only pre-auth table read is: invitations (all columns, rows
--      gated by the pending + unexpired RLS policy). Everything else is
--      revoked from anon. No public product catalog exists today, so
--      products gets NO anon carve-out and products.cost_price (margin
--      data) is never publicly readable. When a public storefront is
--      added, expose products through a COLUMN-LEVEL grant or a view
--      that excludes cost_price -- never a table-level SELECT.
--
-- INSERT-policy verification (no recreation needed):
--   All four tables carry tenant_id on every insert from the app
--   (productsService, salesService, employeesService, customersService,
--   settingsService verified) and their INSERT policies from migration
--   001 already enforce tenant scoping:
--     employees_tenant_insert  -> WITH CHECK (tenant_id = current_tenant_id()
--                                          AND has_tenant_role(...))
--     products_tenant_insert   -> WITH CHECK (tenant_id = current_tenant_id()
--                                          AND has_tenant_role(...))
--     sales_tenant_insert      -> WITH CHECK (tenant_id = current_tenant_id())
--     sale_items_tenant_insert -> WITH CHECK (tenant_id = current_tenant_id())
--   For the FOR ALL policies on other tables, omitted WITH CHECK falls
--   back to the USING expression, which is also tenant-scoped.
--   has_tenant_role()/current_tenant_id() were rewritten in migration
--   004 to read employees (no dangling references to the dropped
--   tenant_members table).
--
-- !!! TEST ON PREVIEW/STAGING FIRST !!!
--   This migration changes access behavior for AUTHENTICATED flows:
--   RLS starts enforcing the *_tenant_* policies on the four tables, so
--   any query that is not tenant-scoped will suddenly return fewer rows
--   or be rejected. Run the manual test checklist from the PR
--   description (login, POS sale, products CRUD, reports, accept-invite
--   flow, landing) before applying to production.
--
-- Idempotency:
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY is a no-op when RLS is
--     already enabled.
--   - REVOKE on a privilege the role does not hold is a no-op (no error).
--   - GRANT SELECT on a table the role can already select is a no-op.
--   - No CREATE POLICY statements are included, so no policy drops are
--     required. Re-running this migration is safe.
-- =====================================================================


-- =====================================================================
-- PART 1: Enable RLS on the four tables left unprotected
-- (activates the existing *_tenant_* policies from migration 001)
-- =====================================================================

-- employees: names, emails, phone, PIN hashes, roles -- tenant-scoped
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- products: catalog with cost_price (margin data) -- tenant-scoped
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- sales: transaction headers (totals, payment method, employee) -- tenant-scoped
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- sale_items: transaction line detail -- tenant-scoped
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- PART 2: Revoke every anon privilege on all 20 public tables
-- Defense in depth: with RLS enabled, row access is policy-gated, but
-- anon (unauthenticated requests) must not hold table privileges at all,
-- except for the invitations carve-out in PART 3.
-- These REVOKEs also make the production hotfix
-- `hotfix_revoke_anon_write_privileges` durable in the repository.
-- =====================================================================

-- tenants: business registry; read via SECURITY DEFINER RPCs and
-- authenticated flows only.
REVOKE ALL ON TABLE public.tenants FROM anon;

-- employees: staff PII and PIN hashes; authenticated only.
REVOKE ALL ON TABLE public.employees FROM anon;

-- products: catalog incl. cost_price (margin data). No public catalog
-- exists today; a future storefront must use a column-level grant or a
-- view excluding cost_price, never table-level SELECT.
REVOKE ALL ON TABLE public.products FROM anon;

-- product_sizes: per-size stock; authenticated only.
REVOKE ALL ON TABLE public.product_sizes FROM anon;

-- customers: PII (name, email, phone, notes) and loyalty data;
-- authenticated only.
REVOKE ALL ON TABLE public.customers FROM anon;

-- sales: financial transaction history; authenticated only.
REVOKE ALL ON TABLE public.sales FROM anon;

-- sale_items: transaction line detail; authenticated only.
REVOKE ALL ON TABLE public.sale_items FROM anon;

-- cash_box_sessions: cash-control sessions; authenticated only.
REVOKE ALL ON TABLE public.cash_box_sessions FROM anon;

-- cash_box_closures: cash-control totals and counted amounts;
-- authenticated only.
REVOKE ALL ON TABLE public.cash_box_closures FROM anon;

-- refunds: refund history and reasons; authenticated only.
REVOKE ALL ON TABLE public.refunds FROM anon;

-- settings: store configuration (tax rate, contact data); used only by
-- authenticated settings screens.
REVOKE ALL ON TABLE public.settings FROM anon;

-- categories: catalog taxonomy; authenticated only (settings screens).
REVOKE ALL ON TABLE public.categories FROM anon;

-- brands: catalog taxonomy; authenticated only (settings screens).
REVOKE ALL ON TABLE public.brands FROM anon;

-- sizes: catalog taxonomy; authenticated only (settings screens).
REVOKE ALL ON TABLE public.sizes FROM anon;

-- size_groups: catalog taxonomy; authenticated only (settings screens).
REVOKE ALL ON TABLE public.size_groups FROM anon;

-- seasons: catalog taxonomy; authenticated only (settings screens).
REVOKE ALL ON TABLE public.seasons FROM anon;

-- sku_counters: internal SKU generation state; accessed through the
-- SECURITY DEFINER SKU function only.
REVOKE ALL ON TABLE public.sku_counters FROM anon;

-- product_attributes: variant attribute definitions; authenticated only.
REVOKE ALL ON TABLE public.product_attributes FROM anon;

-- product_variants: variant rows (SKU, price, stock); authenticated only.
REVOKE ALL ON TABLE public.product_variants FROM anon;

-- invitations: fully revoked here; restored in PART 3.
REVOKE ALL ON TABLE public.invitations FROM anon;


-- =====================================================================
-- PART 3: Pre-auth carve-out -- invitations
-- =====================================================================
-- Justification: AcceptInvitePage must read the invitation BEFORE
-- authentication to display the invite details (email, role) and
-- validate the token. getInvitationByToken() runs select('*'), so a
-- column-level grant is not viable (it would either break the query or
-- expose every column anyway); the table has exactly the nine columns
-- the client maps. Row access is restricted by the RLS policy
-- "invitations_select_by_token" (status = 'pending' AND expires_at > NOW()),
-- so accepted and expired invitations are never visible.
--
-- Residual risk (accepted for now): anon can enumerate ALL pending,
-- unexpired invitations, including their tokens (invite hijacking) and
-- the invited_by user id. Recommended follow-up: move the token lookup
-- into a SECURITY DEFINER RPC (token-scoped internally) and then revoke
-- this grant as well.
GRANT SELECT ON TABLE public.invitations TO anon;


-- =====================================================================
-- VERIFICATION (run against preview/staging after applying)
-- =====================================================================
-- 1. RLS must be enabled on every public table:
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 2. anon must be able to SELECT only from invitations:
SELECT tablename AS table_name,
       has_table_privilege('anon', 'public.' || tablename, 'SELECT') AS anon_can_select
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
