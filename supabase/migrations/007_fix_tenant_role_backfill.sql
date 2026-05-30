-- ============================================
-- Casa Lis POS - Fix tenant_role backfill
-- Fix: Migration 004 added tenant_role to
-- employees but did NOT backfill existing rows.
-- This broke current_tenant_id() for any
-- employee created before migration 004, which
-- in turn broke RLS policies (e.g. invitations
-- INSERT) that depend on it.
--
-- This migration:
-- 1. Backfills tenant_role for existing employees
-- 2. Adds a JWT fallback to current_tenant_id()
--    so it works even if tenant_role is missing
-- ============================================

-- --------------------------------------------
-- Backfill tenant_role for existing employees
-- Map: admin → owner, other roles stay the same
-- --------------------------------------------
UPDATE employees
SET tenant_role = CASE
  WHEN role = 'admin' THEN 'owner'
  ELSE role
END
WHERE tenant_role IS NULL;

-- --------------------------------------------
-- Update current_tenant_id() with JWT fallback
-- First tries employees.tenant_role, then
-- falls back to JWT user_metadata -> tenant_id
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.current_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT tenant_id INTO tenant_uuid
  FROM employees
  WHERE user_id = auth.uid()
    AND tenant_role IS NOT NULL
  LIMIT 1;

  IF tenant_uuid IS NULL THEN
    BEGIN
      tenant_uuid := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      tenant_uuid := NULL;
    END;
  END IF;

  RETURN tenant_uuid;
END;
$function$;
