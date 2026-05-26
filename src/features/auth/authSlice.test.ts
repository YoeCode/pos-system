import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, {
  loginUser,
  logoutUser,
  setActiveTenant,
  clearError,
} from './authSlice';
import type { AuthUser } from '../../types';

const TENANT_STORAGE_KEY = 'nexopos_tenant_id';

const mockUser: AuthUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: '',
  role: 'admin',
  tenantId: 'tenant-123',
  tenantRole: 'owner',
};

function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
}

const INITIAL_STATE = authReducer(undefined, { type: '@@INIT' });

describe('authSlice - multi-tenant', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('loginUser.fulfilled', () => {
    it('sets user with tenantId in state', () => {
      const state = authReducer(
        INITIAL_STATE,
        loginUser.fulfilled(mockUser, '', { email: '', password: '' })
      );
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.tenantId).toBe('tenant-123');
      expect(state.user?.tenantRole).toBe('owner');
    });

    it('persists tenantId to localStorage', () => {
      authReducer(
        INITIAL_STATE,
        loginUser.fulfilled(mockUser, '', { email: '', password: '' })
      );
      expect(mockStorage.getItem(TENANT_STORAGE_KEY)).toBe('tenant-123');
    });

    it('persists session to localStorage', () => {
      authReducer(
        INITIAL_STATE,
        loginUser.fulfilled(mockUser, '', { email: '', password: '' })
      );
      const session = JSON.parse(mockStorage.getItem('nexopos_session') || '{}');
      expect(session.isAuthenticated).toBe(true);
      expect(session.user.tenantId).toBe('tenant-123');
    });
  });

  describe('logoutUser.fulfilled', () => {
    it('clears user and tenant from state', () => {
      const loggedInState = authReducer(
        INITIAL_STATE,
        loginUser.fulfilled(mockUser, '', { email: '', password: '' })
      );
      const state = authReducer(loggedInState, logoutUser.fulfilled(undefined, ''));
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('removes tenantId from localStorage', () => {
      mockStorage.setItem(TENANT_STORAGE_KEY, 'tenant-123');
      mockStorage.setItem('nexopos_session', JSON.stringify({ isAuthenticated: true, user: mockUser }));
      authReducer(INITIAL_STATE, logoutUser.fulfilled(undefined, ''));
      expect(mockStorage.getItem(TENANT_STORAGE_KEY)).toBeNull();
      expect(mockStorage.getItem('nexopos_session')).toBeNull();
    });
  });

  describe('setActiveTenant.fulfilled', () => {
    it('updates user tenantId and tenantRole in state', () => {
      const loggedInState = authReducer(
        INITIAL_STATE,
        loginUser.fulfilled(mockUser, '', { email: '', password: '' })
      );
      const updatedUser: AuthUser = {
        ...mockUser,
        tenantId: 'tenant-456',
        tenantRole: 'manager',
      };
      const state = authReducer(
        loggedInState,
        setActiveTenant.fulfilled(updatedUser, '', 'tenant-456')
      );
      expect(state.user?.tenantId).toBe('tenant-456');
      expect(state.user?.tenantRole).toBe('manager');
    });
  });

  describe('clearError', () => {
    it('clears error state', () => {
      const errorState = authReducer(
        INITIAL_STATE,
        loginUser.rejected(new Error('fail'), '', { email: '', password: '' }, 'Invalid credentials')
      );
      expect(errorState.error).toBe('Invalid credentials');
      const state = authReducer(errorState, clearError());
      expect(state.error).toBeNull();
    });
  });
});
