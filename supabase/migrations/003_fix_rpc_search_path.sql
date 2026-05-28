-- Fix: Add explicit search_path to SECURITY DEFINER functions
-- PostgreSQL 15+ restricts search_path for SECURITY DEFINER functions.
-- Without it, FK constraints referencing auth.users fail because
-- the auth schema is not in the search path.

CREATE OR REPLACE FUNCTION public.register_new_business(
  p_user_id uuid,
  p_email text,
  p_business_name text,
  p_slug text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth, public'
AS $function$
DECLARE
  new_tenant RECORD;
BEGIN
  INSERT INTO tenants (name, slug, owner_id, plan, subscription_status, max_employees, max_products, max_sales_monthly)
  VALUES (p_business_name, p_slug, p_user_id, 'free', 'active', 2, 100, 500)
  RETURNING * INTO new_tenant;

  INSERT INTO employees (tenant_id, user_id, name, email, role, active, status, pin)
  VALUES (new_tenant.id, p_user_id, p_business_name, p_email, 'admin', true, 'active', '0000');

  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (new_tenant.id, p_user_id, 'owner');

  RETURN jsonb_build_object(
    'tenant_id', new_tenant.id,
    'slug', new_tenant.slug,
    'name', new_tenant.name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;
