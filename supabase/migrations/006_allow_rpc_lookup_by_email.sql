-- ============================================
-- Casa Lis POS - Allow RPC lookup by email
-- Fix: When accepting an invitation, the user's
-- email might already exist in auth.users (e.g.
-- from a previous registration). In that case
-- signUp() fails with "User already registered".
--
-- This migration makes p_user_id optional so the
-- frontend can pass null and the RPC will look
-- up the auth user by email from the invitation.
-- ============================================

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
BEGIN
  SELECT * INTO inv FROM invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- If no user_id provided, look up the auth user by email from the invitation
  IF p_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = inv.email;
    IF NOT FOUND THEN
      RETURN false;
    END IF;
  ELSE
    v_user_id := p_user_id;
  END IF;

  INSERT INTO employees (id, tenant_id, user_id, name, email, role, active, status, pin, tenant_role)
  VALUES (gen_random_uuid(), inv.tenant_id, v_user_id, p_name, inv.email, inv.role, true, 'active', '0000', inv.role);

  UPDATE invitations SET status = 'accepted' WHERE id = inv.id;

  -- Auto-confirm the user's email so they can login immediately
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = v_user_id;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;
