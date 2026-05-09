import { supabase, isSupabaseConfigured } from '../../supabase/client';
import type { AuthUser, UserRole } from '../../types';

const mockUsers: AuthUser[] = [
  {
    id: '1',
    name: 'Ana Martínez',
    email: 'admin@casalis.com',
    password: 'admin123',
    role: 'admin',
    terminal: '01',
  },
  {
    id: '2',
    name: 'Carlos López',
    email: 'manager@casalis.com',
    password: 'manager123',
    role: 'manager',
    terminal: '01',
  },
  {
    id: '3',
    name: 'María García',
    email: 'supervisor@casalis.com',
    password: 'super123',
    role: 'supervisor',
    terminal: '01',
  },
  {
    id: '4',
    name: 'Juan Rodríguez',
    email: 'cashier@casalis.com',
    password: 'cash123',
    role: 'cashier',
    terminal: '01',
  },
  {
    id: '5',
    name: 'Laura Fernández',
    email: 'cashier2@casalis.com',
    password: 'cash123',
    role: 'cashier',
    terminal: '02',
  },
];

async function signInWithSupabase(email: string, password: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, name, email, role, terminal_id, avatar_url')
    .eq('user_id', data.user.id)
    .eq('active', true)
    .maybeSingle();

  if (empError || !employee) return null;

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    password: '',
    role: employee.role as UserRole,
    terminal: employee.terminal_id || undefined,
    avatar: employee.avatar_url || undefined,
  };
}

async function signOutFromSupabase(): Promise<void> {
  await supabase.auth.signOut();
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

  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    password: '',
    role: employee.role as UserRole,
    terminal: employee.terminal_id || undefined,
    avatar: employee.avatar_url || undefined,
  };
}

async function getSupabaseAvailableUsers(): Promise<{ email: string; name: string; role: UserRole }[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('name, email, role')
    .eq('active', true)
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
  } catch { /* empty */ }
  return null;
}

export async function getAvailableUsers(): Promise<{ email: string; name: string; role: UserRole }[]> {
  if (isSupabaseConfigured()) {
    return getSupabaseAvailableUsers();
  }
  return getMockAvailableUsers();
}
