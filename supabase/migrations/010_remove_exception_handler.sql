-- Fix: Remove blanket EXCEPTION handler to expose real errors
-- 
-- The EXCEPTION WHEN OTHERS THEN RETURN false was swallowing
-- all errors, making it impossible to diagnose why the employee
-- INSERT/UPDATE was failing. This migration removes the blanket
-- catch so errors propagate to the frontend for visibility.

CREATE OR REPLACE FUNCTION public.complete_invitation_acceptance(
  p_token text,
  p_user_id uuid DEFAULT NULL,
  p_name text DEFAULT ''
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  inv RECORD;
  v_user_id uuid;
  v_employee_role text;
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF p_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = inv.email;
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  ELSE
    v_user_id := p_user_id;
  END IF;

  v_employee_role := CASE
    WHEN inv.role = 'owner' THEN 'admin'
    ELSE inv.role
  END;

  INSERT INTO employees (id, tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (gen_random_uuid(), inv.tenant_id, v_user_id, p_name, inv.email, v_employee_role, true, 'active', '0000', inv.role)
  ON CONFLICT (email) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      user_id = EXCLUDED.user_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      tenant_role = EXCLUDED.tenant_role,
      active = true,
      status = 'active',
      pin = '0000';

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = v_user_id;

  RETURN true;
END;
$function$;
