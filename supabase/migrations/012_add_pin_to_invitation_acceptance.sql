CREATE OR REPLACE FUNCTION public.complete_invitation_acceptance(
  p_token text,
  p_user_id uuid DEFAULT NULL,
  p_name text DEFAULT '',
  p_pin text DEFAULT '0000'
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
  v_pin text;
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

  v_pin := COALESCE(NULLIF(p_pin, ''), '0000');

  INSERT INTO employees (id, tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (gen_random_uuid(), inv.tenant_id, v_user_id, p_name, inv.email, v_employee_role, true, 'active', v_pin, inv.role)
  ON CONFLICT (email) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      user_id = EXCLUDED.user_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      tenant_role = EXCLUDED.tenant_role,
      active = true,
      status = 'active',
      pin = v_pin;

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;

  RETURN true;
END;
$function$;