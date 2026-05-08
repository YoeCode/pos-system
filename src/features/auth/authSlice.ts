import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '../../types';
import { signIn, signOut, getCurrentUser } from './authService';

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
    try { localStorage.removeItem('nexopos_session'); } catch { void 0; }
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
    const user = await signIn(email, password);
    if (!user) return rejectWithValue('Invalid credentials');
    return user;
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
      })
      .addCase(initializeAuth.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload;
          localStorage.setItem('nexopos_session', JSON.stringify({
            isAuthenticated: true,
            user: action.payload,
          }));
        }
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

export { getAvailableUsers } from './authService';
