import { describe, it, expect } from 'vitest';
import customersReducer, {
  createCustomerAsync,
  updateCustomerAsync,
  deactivateCustomerAsync,
  addLoyaltyPointsAsync,
  deductLoyaltyPointsAsync,
  selectAllCustomers,
  selectActiveCustomers,
  selectCustomerById,
} from './customersSlice';
import { computeTier } from './customersService';
import type { Customer, LoyaltyTierConfig } from '../../types';

const DEFAULT_TIERS: LoyaltyTierConfig[] = [
  { tier: 'bronze',   threshold: 0,    discountPct: 0 },
  { tier: 'silver',   threshold: 500,  discountPct: 0.03 },
  { tier: 'gold',     threshold: 1500, discountPct: 0.05 },
  { tier: 'platinum', threshold: 5000, discountPct: 0.08 },
];

const INITIAL_STATE = customersReducer(undefined, { type: '@@INIT' });

describe('customersSlice', () => {
  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with empty items, not loading', () => {
    expect(INITIAL_STATE.items).toEqual([]);
    expect(INITIAL_STATE.isLoading).toBe(false);
    expect(INITIAL_STATE.error).toBeNull();
  });

  // ── createCustomerAsync.fulfilled ──────────────────────────────────────────

  describe('createCustomerAsync.fulfilled', () => {
    it('adds the new customer to items', () => {
      const newCustomer: Customer = {
        id: 'new-1',
        name: 'Test Customer',
        email: 'test@test.es',
        phone: '600000001',
        notes: '',
        active: true,
        loyaltyPoints: 0,
        tier: 'bronze',
        totalSpent: 0,
        createdAt: '2025-01-01T00:00:00Z',
      };
      const state = customersReducer(
        INITIAL_STATE,
        createCustomerAsync.fulfilled(newCustomer, 'req-id', { name: 'Test Customer', email: '', phone: '', notes: '', active: true }),
      );
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Test Customer');
    });
  });

  // ── updateCustomerAsync.fulfilled ──────────────────────────────────────────

  describe('updateCustomerAsync.fulfilled', () => {
    it('replaces the existing customer in items', () => {
      const existing: Customer = {
        id: 'cust-1',
        name: 'Original',
        email: '',
        phone: '',
        notes: '',
        active: true,
        loyaltyPoints: 100,
        tier: 'bronze',
        totalSpent: 100,
        createdAt: '2025-01-01T00:00:00Z',
      };
      const seeded = customersReducer(
        INITIAL_STATE,
        createCustomerAsync.fulfilled(existing, 'req-1', { name: 'Original', email: '', phone: '', notes: '', active: true }),
      );
      const updated: Customer = { ...existing, name: 'Updated', phone: '999999999' };
      const state = customersReducer(
        seeded,
        updateCustomerAsync.fulfilled(updated, 'req-2', { id: 'cust-1', name: 'Updated', phone: '999999999' }),
      );
      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe('Updated');
      expect(state.items[0].phone).toBe('999999999');
    });
  });

  // ── deactivateCustomerAsync.fulfilled ──────────────────────────────────────

  describe('deactivateCustomerAsync.fulfilled', () => {
    it('sets active=false without removing the customer', () => {
      const existing: Customer = {
        id: 'cust-1',
        name: 'Active Customer',
        email: '',
        phone: '',
        notes: '',
        active: true,
        loyaltyPoints: 0,
        tier: 'bronze',
        totalSpent: 0,
        createdAt: '2025-01-01T00:00:00Z',
      };
      const seeded = customersReducer(
        INITIAL_STATE,
        createCustomerAsync.fulfilled(existing, 'req-1', { name: 'Active Customer', email: '', phone: '', notes: '', active: true }),
      );
      const state = customersReducer(
        seeded,
        deactivateCustomerAsync.fulfilled('cust-1', 'req-2', 'cust-1'),
      );
      expect(state.items).toHaveLength(1);
      expect(state.items[0].active).toBe(false);
    });
  });

  // ── addLoyaltyPointsAsync.fulfilled ────────────────────────────────────────

  describe('addLoyaltyPointsAsync.fulfilled', () => {
    it('replaces the customer with the server response', () => {
      const existing: Customer = {
        id: 'cust-1',
        name: 'Test',
        email: '',
        phone: '',
        notes: '',
        active: true,
        loyaltyPoints: 100,
        tier: 'bronze',
        totalSpent: 100,
        createdAt: '2025-01-01T00:00:00Z',
      };
      const seeded = customersReducer(
        INITIAL_STATE,
        createCustomerAsync.fulfilled(existing, 'req-1', { name: 'Test', email: '', phone: '', notes: '', active: true }),
      );
      const updated: Customer = { ...existing, loyaltyPoints: 200, totalSpent: 200, tier: 'silver' };
      const state = customersReducer(
        seeded,
        addLoyaltyPointsAsync.fulfilled(updated, 'req-2', { customerId: 'cust-1', points: 100, amountSpent: 100, tiers: DEFAULT_TIERS }),
      );
      expect(state.items[0].loyaltyPoints).toBe(200);
      expect(state.items[0].tier).toBe('silver');
    });
  });

  // ── deductLoyaltyPointsAsync.fulfilled ─────────────────────────────────────

  describe('deductLoyaltyPointsAsync.fulfilled', () => {
    it('replaces the customer with the server response', () => {
      const existing: Customer = {
        id: 'cust-1',
        name: 'Test',
        email: '',
        phone: '',
        notes: '',
        active: true,
        loyaltyPoints: 500,
        tier: 'silver',
        totalSpent: 500,
        createdAt: '2025-01-01T00:00:00Z',
      };
      const seeded = customersReducer(
        INITIAL_STATE,
        createCustomerAsync.fulfilled(existing, 'req-1', { name: 'Test', email: '', phone: '', notes: '', active: true }),
      );
      const updated: Customer = { ...existing, loyaltyPoints: 300, tier: 'bronze' };
      const state = customersReducer(
        seeded,
        deductLoyaltyPointsAsync.fulfilled(updated, 'req-2', { customerId: 'cust-1', points: 200, amountSpent: 0, tiers: DEFAULT_TIERS }),
      );
      expect(state.items[0].loyaltyPoints).toBe(300);
      expect(state.items[0].tier).toBe('bronze');
    });
  });

  // ── Selectors ──────────────────────────────────────────────────────────────

  describe('selectors', () => {
    const mockState = {
      customers: {
        items: [
          { id: '1', name: 'Active One', active: true, loyaltyPoints: 100, tier: 'bronze', totalSpent: 100, createdAt: '2025-01-01T00:00:00Z', email: '', phone: '', notes: '' },
          { id: '2', name: 'Inactive One', active: false, loyaltyPoints: 0, tier: 'bronze', totalSpent: 0, createdAt: '2025-01-01T00:00:00Z', email: '', phone: '', notes: '' },
          { id: '3', name: 'Active Two', active: true, loyaltyPoints: 200, tier: 'silver', totalSpent: 200, createdAt: '2025-01-01T00:00:00Z', email: '', phone: '', notes: '' },
        ] as Customer[],
        isLoading: false,
        error: null,
      },
    };

    it('selectAllCustomers returns all items', () => {
      expect(selectAllCustomers(mockState)).toHaveLength(3);
    });

    it('selectActiveCustomers returns only active customers', () => {
      const active = selectActiveCustomers(mockState);
      expect(active).toHaveLength(2);
      expect(active.every(c => c.active)).toBe(true);
    });

    it('selectCustomerById returns correct customer', () => {
      expect(selectCustomerById(mockState, '2')?.name).toBe('Inactive One');
    });

    it('selectCustomerById returns undefined for unknown id', () => {
      expect(selectCustomerById(mockState, 'unknown')).toBeUndefined();
    });
  });

  // ── computeTier helper ────────────────────────────────────────────────────

  describe('computeTier', () => {
    it('returns bronze for 0 points', () => {
      expect(computeTier(0, DEFAULT_TIERS)).toBe('bronze');
    });

    it('returns silver above threshold', () => {
      expect(computeTier(500, DEFAULT_TIERS)).toBe('silver');
    });

    it('returns platinum above 5000', () => {
      expect(computeTier(6000, DEFAULT_TIERS)).toBe('platinum');
    });

    it('returns correct tier at exact threshold', () => {
      expect(computeTier(1500, DEFAULT_TIERS)).toBe('gold');
    });
  });
});
