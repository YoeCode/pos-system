-- ============================================
-- Casa Lis POS - Auto-confirm email on invitation
-- Fix: Users created via invitation or registration
-- could not login because email was not confirmed.
-- 
-- This migration updates both RPCs to set
-- email_confirmed_at = NOW() on auth.users
-- so the user can login immediately without
-- needing email confirmation.
-- ============================================

-- --------------------------------------------
-- Fix complete_invitation_acceptance
-- Add auth to search_path and auto-confirm email
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_invitation_acceptance(
  p_token text,
  p_user_id uuid,
  p_name text
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO employees (id, tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (gen_random_uuid(), inv.tenant_id, p_user_id, p_name, inv.email, inv.role, true, 'active', '0000', inv.role);

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;

  -- Auto-confirm the user's email so they can login immediately
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = p_user_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- --------------------------------------------
-- Fix register_new_business
-- Add auto-confirm email for new registrations
-- (search_path already includes 'auth')
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.register_new_business(
  p_user_id uuid,
  p_email text,
  p_business_name text,
  p_slug text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
DECLARE
  new_tenant RECORD;
BEGIN
  INSERT INTO public.tenants (name, slug, owner_id, plan, subscription_status, max_employees, max_products, max_sales_monthly)
  VALUES (p_business_name, p_slug, p_user_id, 'free', 'active', 2, 100, 500)
  RETURNING * INTO new_tenant;

  INSERT INTO public.employees (tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (new_tenant.id, p_user_id, p_business_name, p_email, 'admin', true, 'active', '0000', 'owner');

  -- Auto-confirm the user's email so they can login immediately
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'tenant_id', new_tenant.id,
    'slug', new_tenant.slug,
    'name', new_tenant.name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;
