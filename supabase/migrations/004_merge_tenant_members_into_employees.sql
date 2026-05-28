-- Merge tenant_members into employees
-- tenant_members was redundant: every member is an employee with tenant-level role.
-- Adding tenant_role to employees eliminates the duplicate table.

ALTER TABLE employees ADD COLUMN tenant_role text;

-- Update current_tenant_id() to query employees instead of tenant_members
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

  RETURN tenant_uuid;
END;
$function$;

-- Update has_tenant_role() to check employees.tenant_role
CREATE OR REPLACE FUNCTION public.has_tenant_role(required_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees
    WHERE tenant_id = current_tenant_id()
      AND user_id = auth.uid()
      AND tenant_role = ANY(required_roles)
  );
END;
$function$;

-- Update register_new_business: set tenant_role on employee, skip tenant_members
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

  INSERT INTO employees (tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (new_tenant.id, p_user_id, p_business_name, p_email, 'admin', true, 'active', '0000', 'owner');

  RETURN jsonb_build_object(
    'tenant_id', new_tenant.id,
    'slug', new_tenant.slug,
    'name', new_tenant.name
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$function$;

-- Update complete_invitation_acceptance: set tenant_role on employee, skip tenant_members
CREATE OR REPLACE FUNCTION public.complete_invitation_acceptance(
  p_token text,
  p_user_id uuid,
  p_name text
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- Update tenants SELECT policy: use employees instead of tenant_members
DROP POLICY IF EXISTS tenants_select_members ON public.tenants;
CREATE POLICY tenants_select_members ON public.tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.tenant_id = tenants.id
        AND e.user_id = auth.uid()
        AND e.tenant_role IS NOT NULL
    )
  );

-- Drop tenant_members policies and table
DROP POLICY IF EXISTS tenant_members_manage ON public.tenant_members;
DROP POLICY IF EXISTS tenant_members_select_own ON public.tenant_members;
DROP TABLE IF EXISTS public.tenant_members;
