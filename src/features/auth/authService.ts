import { supabase } from '../../supabase/client';
import type { AuthUser, UserRole, TenantRole } from '../../types';

const TENANT_STORAGE_KEY = 'nexopos_tenant_id';

function storeTenantId(tenantId: string): void {
  localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

function getStoredTenantId(): string | null {
  return localStorage.getItem(TENANT_STORAGE_KEY);
}

function clearTenantId(): void {
  localStorage.removeItem(TENANT_STORAGE_KEY);
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: TenantRole;
}

async function getUserTenantsInternal(userId: string): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('tenant_id, tenant_role, tenants(id, name, slug)')
    .eq('user_id', userId)
    .not('tenant_role', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    tenantId: row.tenant_id,
    tenantName: row.tenants?.name || '',
    tenantSlug: row.tenants?.slug || '',
    role: row.tenant_role as TenantRole,
  }));
}

export async function getUserTenants(userId: string): Promise<TenantMembership[]> {
  return getUserTenantsInternal(userId);
}

async function resolveTenantForUser(userId: string): Promise<TenantMembership | null> {
  const storedTenantId = getStoredTenantId();
  const tenants = await getUserTenantsInternal(userId);

  if (tenants.length === 0) return null;
  if (tenants.length === 1) {
    storeTenantId(tenants[0].tenantId);
    return tenants[0];
  }

  if (storedTenantId) {
    const match = tenants.find(t => t.tenantId === storedTenantId);
    if (match) return match;
  }

  storeTenantId(tenants[0].tenantId);
  return tenants[0];
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const existingUser = sessionData?.session?.user;

  if (existingUser && existingUser.email?.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Ya hay un usuario logueado en este dispositivo. Cierra sesión primero para iniciar con otro usuario.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message === 'Invalid login credentials'
      ? 'Credenciales incorrectas'
      : `Error de login: ${error.message}`);
  }
  if (!data.user) {
    throw new Error('Credenciales incorrectas');
  }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, email, role, terminal_id, avatar_url')
    .eq('user_id', data.user.id)
    .eq('active', true)
    .maybeSingle();

  if (empError || !employee) {
    throw new Error('Usuario no vinculado a un empleado. Contacta al administrador.');
  }

  const tenantMembership = await resolveTenantForUser(data.user.id);

  if (!tenantMembership) {
    throw new Error('Usuario sin empresa asignada. Contacta al administrador.');
  }

  return {
    id: employee.id,
    authUserId: data.user.id,
    name: employee.name,
    email: employee.email,
    password: '',
    role: employee.role as UserRole,
    tenantId: tenantMembership.tenantId,
    tenantRole: tenantMembership.role,
    terminal: employee.terminal_id || undefined,
    avatar: employee.avatar_url || undefined,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  clearTenantId();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('id, name, email, role, terminal_id, avatar_url')
    .eq('user_id', data.session.user.id)
    .eq('active', true)
    .maybeSingle();

  if (error || !employee) return null;

  const tenantMembership = await resolveTenantForUser(data.session.user.id);

  return {
    id: employee.id,
    authUserId: data.session.user.id,
    name: employee.name,
    email: employee.email,
    password: '',
    role: employee.role as UserRole,
    tenantId: tenantMembership?.tenantId,
    tenantRole: tenantMembership?.role,
    terminal: employee.terminal_id || undefined,
    avatar: employee.avatar_url || undefined,
  };
}

export async function getAvailableUsers(): Promise<{ email: string; name: string; role: UserRole }[]> {
  const tenantId = getStoredTenantId();
  if (!tenantId) return [];

  const { data, error } = await supabase
    .from('employees')
    .select('name, email, role')
    .eq('active', true)
    .eq('tenant_id', tenantId)
    .order('name');

  if (error || !data) return [];

  return data.map(e => ({ email: e.email, name: e.name, role: e.role as UserRole }));
}
