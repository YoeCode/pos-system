import { supabase, isSupabaseConfigured } from '../../supabase/client';
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

const mockUsers: AuthUser[] = [
  {
    id: '1',
    name: 'Ana Martínez',
    email: 'admin@casalis.com',
    password: 'admin123',
    role: 'admin',
    tenantId: 'legacy-tenant',
    tenantRole: 'owner',
    terminal: '01',
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'manager@casalis.com',
    password: 'manager123',
    role: 'manager',
    tenantId: 'legacy-tenant',
    tenantRole: 'manager',
    terminal: '01',
  },
  {
    id: '3',
    name: 'María García',
    email: 'supervisor@casalis.com',
    password: 'super123',
    role: 'supervisor',
    tenantId: 'legacy-tenant',
    tenantRole: 'supervisor',
    terminal: '01',
  },
  {
    id: '4',
    name: 'Juan Rodríguez',
    email: 'cashier@casalis.com',
    password: 'cash123',
    role: 'cashier',
    tenantId: 'legacy-tenant',
    tenantRole: 'cashier',
    terminal: '01',
  },
  {
    id: '5',
    name: 'Laura Fernández',
    email: 'cashier2@casalis.com',
    password: 'cash123',
    role: 'cashier',
    tenantId: 'legacy-tenant',
    tenantRole: 'cashier',
    terminal: '02',
  },
];

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: TenantRole;
}

async function getUserTenantsInternal(userId: string): Promise<TenantMembership[]> {
  const { data, error } = await supabase
    .from('tenant_members')
    .select('tenant_id, role, tenants(id, name, slug)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    tenantId: row.tenant_id,
    tenantName: row.tenants?.name || '',
    tenantSlug: row.tenants?.slug || '',
    role: row.role as TenantRole,
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

async function signInWithSupabase(email: string, password: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
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

async function signOutFromSupabase(): Promise<void> {
  await supabase.auth.signOut();
  clearTenantId();
}

async function getSupabaseCurrentUser(): Promise<AuthUser | null> {
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

async function getSupabaseAvailableUsers(): Promise<{ email: string; name: string; role: UserRole }[]> {
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

function signInWithMock(email: string, password: string): AuthUser | null {
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

function getMockAvailableUsers(): { email: string; name: string; role: UserRole }[] {
  return mockUsers.map(({ email, name, role }) => ({ email, name, role }));
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  if (isSupabaseConfigured()) {
    return signInWithSupabase(email, password);
  }
  return signInWithMock(email, password);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    await signOutFromSupabase();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isSupabaseConfigured()) {
    return getSupabaseCurrentUser();
  }
  try {
    const stored = localStorage.getItem('nexopos_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user?.email) {
        const user = mockUsers.find(u => u.email === parsed.user.email);
        if (user) return user;
      }
    }
  } catch {}
  return null;
}

export async function getAvailableUsers(): Promise<{ email: string; name: string; role: UserRole }[]> {
  if (isSupabaseConfigured()) {
    return getSupabaseAvailableUsers();
  }
  return getMockAvailableUsers();
}
