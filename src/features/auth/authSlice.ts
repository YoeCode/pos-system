import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser, TenantRole } from '../../types';
import { supabase } from '../../supabase/client';
import { signIn, signOut, getCurrentUser } from './authService';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  isLoading: boolean;
}

const TENANT_STORAGE_KEY = 'nexopos_tenant_id';

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
    try { localStorage.removeItem('nexopos_session'); } catch {}
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

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await signIn(email, password);
      if (!user) return rejectWithValue('Credenciales incorrectas');
      return user;
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Error de autenticación');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await signOut();
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async () => {
    const user = await getCurrentUser();
    return user;
  }
);

export const setActiveTenant = createAsyncThunk(
  'auth/setActiveTenant',
  async (tenantId: string, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    const user = state.auth.user;
    if (!user) return rejectWithValue('No user logged in');
    if (!user.authUserId) return rejectWithValue('Missing auth user id');

    const { data, error } = await supabase
      .from('tenant_members')
      .select('tenant_id, role, tenants(id, name, slug)')
      .eq('user_id', user.authUserId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) return rejectWithValue('Invalid tenant');

    const row = data as Record<string, any>;
    const updatedUser: AuthUser = {
      ...user,
      tenantId: row.tenant_id,
      tenantRole: row.role as TenantRole,
    };

    localStorage.setItem(TENANT_STORAGE_KEY, row.tenant_id);
    localStorage.setItem('nexopos_session', JSON.stringify({
      isAuthenticated: true,
      user: updatedUser,
    }));

    return updatedUser;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        if (action.payload.tenantId) {
          localStorage.setItem(TENANT_STORAGE_KEY, action.payload.tenantId);
        }
        localStorage.setItem('nexopos_session', JSON.stringify({
          isAuthenticated: true,
          user: action.payload,
        }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        localStorage.removeItem('nexopos_session');
        localStorage.removeItem(TENANT_STORAGE_KEY);
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload;
          if (action.payload.tenantId) {
            localStorage.setItem(TENANT_STORAGE_KEY, action.payload.tenantId);
          }
          localStorage.setItem('nexopos_session', JSON.stringify({
            isAuthenticated: true,
            user: action.payload,
          }));
        }
      })
      .addCase(setActiveTenant.fulfilled, (state, action: PayloadAction<AuthUser>) => {
        state.user = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

export { getAvailableUsers } from './authService';
