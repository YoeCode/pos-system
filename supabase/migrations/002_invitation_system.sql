-- ============================================
-- Casa Lis POS - Invitation System
-- Employee invitation flow with email tokens
-- ============================================

-- --------------------------------------------
-- T2.1: Create invitations table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'manager', 'supervisor', 'cashier')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id, status);

-- --------------------------------------------
-- T2.2: Add status column to employees (pending/active/inactive)
-- --------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('pending', 'active', 'inactive'));

UPDATE employees SET status = CASE WHEN active = true THEN 'active' ELSE 'inactive' END 
WHERE status IS NULL;

-- --------------------------------------------
-- T2.3: RLS for invitations table
-- --------------------------------------------
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_own" ON invitations;
CREATE POLICY "invitations_select_own" ON invitations
  FOR SELECT USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin', 'manager'])
  );

DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "invitations_update" ON invitations;
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE USING (
    tenant_id = current_tenant_id()
    AND has_tenant_role(ARRAY['owner', 'admin'])
  );

-- Allow public SELECT by token for the accept-invite page (no auth needed)
DROP POLICY IF EXISTS "invitations_select_by_token" ON invitations;
CREATE POLICY "invitations_select_by_token" ON invitations
  FOR SELECT USING (
    status = 'pending' AND expires_at > NOW()
  );

-- --------------------------------------------
-- T2.4: Helper to clean expired invitations
-- --------------------------------------------
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations 
  SET status = 'expired' 
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run immediately
SELECT expire_old_invitations();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM invitations) as invitations,
  (SELECT COUNT(*) FROM employees WHERE status IS NULL) as employees_without_status;
