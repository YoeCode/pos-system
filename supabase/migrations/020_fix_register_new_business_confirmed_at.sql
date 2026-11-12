-- 020: Fix register_new_business writing to generated column confirmed_at.
--
-- auth.users.confirmed_at is GENERATED ALWAYS AS (LEAST(email_confirmed_at,
-- phone_confirmed_at)) (GoTrue schema). register_new_business still assigned it
-- manually -- the pattern migration 011 removed from
-- complete_invitation_acceptance but missed here -- so every new-business
-- registration failed with:
--   column "confirmed_at" can only be updated to DEFAULT
-- and the function's EXCEPTION handler surfaced that message while rolling back
-- the tenant/employee inserts. Production is affected too.
--
-- Fix: identical function and behavior without the confirmed_at assignment.
-- email_confirmed_at stays explicitly set (it is a regular column, and setting it
-- is what makes the generated confirmed_at compute itself).

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

  -- Auto-confirm the user's email so they can login immediately.
  -- Only email_confirmed_at: confirmed_at is a generated column (see header).
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
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
