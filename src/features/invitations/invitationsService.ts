import { supabase } from '../../supabase/client';
import type { TenantRole } from '../../types';

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: TenantRole;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface InvitationInput {
  email: string;
  role: TenantRole;
  tenantId: string;
  invitedBy: string;
}

function mapDbInvitation(row: any): Invitation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    role: row.role as TenantRole,
    invitedBy: row.invited_by,
    token: row.token,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export async function createInvitation(input: InvitationInput): Promise<Invitation | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      tenant_id: input.tenantId,
      email: input.email.toLowerCase().trim(),
      role: input.role,
      invited_by: input.invitedBy,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('createInvitation error:', error);
    return null;
  }

  return mapDbInvitation(data);
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;
  return mapDbInvitation(data);
}

export async function acceptInvitation(
  token: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { data, error } = await supabase.rpc('accept_invitation_by_token', {
    p_token: token,
  });

  if (error) {
    console.error('acceptInvitation RPC error:', error);
    return false;
  }

  return data === true;
}

export async function getInvitationsByTenant(tenantId: string): Promise<Invitation[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(mapDbInvitation);
}

export async function cancelInvitation(invitationId: string, tenantId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId)
    .eq('tenant_id', tenantId);

  return !error;
}
