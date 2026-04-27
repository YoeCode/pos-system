import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
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

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  isLoading: boolean;
}

const loadStoredSession = (): { isAuthenticated: boolean; user: AuthUser | null } => {
  try {
    const stored = localStorage.getItem('nexopos_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user && parsed.isAuthenticated) {
        return { isAuthenticated: true, user: parsed.user };
      }
    }
  } catch {
    try { localStorage.removeItem('nexopos_session'); } catch { /* ignore */ }
  }
  return { isAuthenticated: false, user: null };
};

const storedSession = loadStoredSession();

const initialState: AuthState = {
  isAuthenticated: storedSession.isAuthenticated,
  user: storedSession.user,
  error: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.error = null;
      localStorage.setItem('nexopos_session', JSON.stringify({
        isAuthenticated: true,
        user: action.payload,
      }));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      localStorage.removeItem('nexopos_session');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { login, loginSuccess, loginFailure, logout, clearError } = authSlice.actions;
export default authSlice.reducer;

export const authenticateUser = (email: string, password: string): AuthUser | null => {
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
};

export const getAvailableUsers = (): { email: string; name: string; role: UserRole }[] =>
  mockUsers.map(({ email, name, role }) => ({ email, name, role }));
