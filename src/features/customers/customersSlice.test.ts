import { describe, it, expect } from 'vitest';
import customersReducer, {
  addCustomer,
  updateCustomer,
  deactivateCustomer,
  addLoyaltyPoints,
} from './customersSlice';
import type { LoyaltyTierConfig } from '../../types';

const DEFAULT_TIERS: LoyaltyTierConfig[] = [
  { tier: 'bronze',   threshold: 0,    discountPct: 0 },
  { tier: 'silver',   threshold: 500,  discountPct: 0.03 },
  { tier: 'gold',     threshold: 1500, discountPct: 0.05 },
  { tier: 'platinum', threshold: 5000, discountPct: 0.08 },
];

const INITIAL_STATE = customersReducer(undefined, { type: '@@INIT' });

describe('customersSlice', () => {
  // ── RF-01 Customer CRUD ──────────────────────────────────────────────────

  describe('addCustomer', () => {
    it('creates customer with loyaltyPoints=0, tier=bronze, active=true', () => {
      const state = customersReducer(
        INITIAL_STATE,
        addCustomer({ name: 'New Test Customer', email: 'new@test.es', phone: '600000001', notes: '', active: true })
      );
      const created = state.customers.find(c => c.name === 'New Test Customer');
      expect(created).toBeDefined();
      expect(created!.loyaltyPoints).toBe(0);
      expect(created!.tier).toBe('bronze');
      expect(created!.totalSpent).toBe(0);
      expect(created!.active).toBe(true);
      expect(created!.id).toBeTruthy();
      expect(created!.createdAt).toBeTruthy();
    });

    it('adds customer to the collection (count increases)', () => {
      const before = INITIAL_STATE.customers.length;
      const s1 = customersReducer(
        INITIAL_STATE,
        addCustomer({ name: 'Customer A', email: '', phone: '', notes: '', active: true })
      );
      const s2 = customersReducer(
        s1,
        addCustomer({ name: 'Customer B', email: '', phone: '', notes: '', active: true })
      );
      expect(s2.customers.length).toBe(before + 2);
    });
  });

  describe('updateCustomer', () => {
    it('merges patch without changing loyaltyPoints or tier', () => {
      const customerId = INITIAL_STATE.customers[0].id;
      const before = INITIAL_STATE.customers[0];
      const state = customersReducer(
        INITIAL_STATE,
        updateCustomer({ id: customerId, phone: '999999999' })
      );
      const updated = state.customers.find(c => c.id === customerId)!;
      expect(updated.phone).toBe('999999999');
      expect(updated.loyaltyPoints).toBe(before.loyaltyPoints);
      expect(updated.tier).toBe(before.tier);
    });
  });

  describe('deactivateCustomer — RF-01-C', () => {
    it('sets active=false without removing the customer', () => {
      const customerId = INITIAL_STATE.customers[0].id;
      const state = customersReducer(INITIAL_STATE, deactivateCustomer(customerId));
      const customer = state.customers.find(c => c.id === customerId)!;
      expect(customer.active).toBe(false);
      expect(state.customers).toHaveLength(INITIAL_STATE.customers.length);
    });
  });

  // ── RF-05 Tier Auto-Recalculation ─────────────────────────────────────────

  describe('addLoyaltyPoints — tier recalculation', () => {
    it('RF-05-A: upgrades tier when threshold is crossed', () => {
      // cust-001 has loyaltyPoints=120, tier=bronze; silver threshold=500
      const customerId = 'cust-001';
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId, points: 400, amountSpent: 400, tiers: DEFAULT_TIERS })
      );
      const customer = state.customers.find(c => c.id === customerId)!;
      expect(customer.loyaltyPoints).toBe(520);
      expect(customer.tier).toBe('silver');
    });

    it('RF-05-B: does not downgrade tier when still above threshold', () => {
      // cust-003 has loyaltyPoints=2340, tier=gold; gold threshold=1500, platinum=5000
      const customerId = 'cust-003';
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId, points: 10, amountSpent: 10, tiers: DEFAULT_TIERS })
      );
      const customer = state.customers.find(c => c.id === customerId)!;
      expect(customer.loyaltyPoints).toBe(2350);
      expect(customer.tier).toBe('gold');
    });

    it('accumulates totalSpent', () => {
      const customerId = 'cust-005';
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId, points: 50, amountSpent: 50, tiers: DEFAULT_TIERS })
      );
      const customer = state.customers.find(c => c.id === customerId)!;
      expect(customer.totalSpent).toBe(50);
    });

    it('correctly resolves platinum tier', () => {
      const customerId = 'cust-003'; // gold, 2340 pts
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId, points: 3000, amountSpent: 3000, tiers: DEFAULT_TIERS })
      );
      const customer = state.customers.find(c => c.id === customerId)!;
      expect(customer.loyaltyPoints).toBe(5340);
      expect(customer.tier).toBe('platinum');
    });

    it('stays bronze when points < silver threshold', () => {
      const customerId = 'cust-005'; // 0 pts
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId, points: 100, amountSpent: 100, tiers: DEFAULT_TIERS })
      );
      expect(state.customers.find(c => c.id === customerId)!.tier).toBe('bronze');
    });

    it('no-ops when customerId is not found', () => {
      const state = customersReducer(
        INITIAL_STATE,
        addLoyaltyPoints({ customerId: 'nonexistent', points: 100, amountSpent: 100, tiers: DEFAULT_TIERS })
      );
      expect(state).toEqual(INITIAL_STATE);
    });
  });

  // ── RNF-01 No circular import ──────────────────────────────────────────────

  describe('selectors', () => {
    it('selectActiveCustomers returns only active customers', async () => {
      const { selectActiveCustomers } = await import('./customersSlice');
      const mockState = { customers: INITIAL_STATE };
      const active = selectActiveCustomers(mockState);
      expect(active.every(c => c.active)).toBe(true);
    });

    it('selectCustomerById returns correct customer', async () => {
      const { selectCustomerById } = await import('./customersSlice');
      const mockState = { customers: INITIAL_STATE };
      const customer = selectCustomerById(mockState, 'cust-001');
      expect(customer?.name).toBe('María García');
    });

    it('selectCustomerById returns undefined for unknown id', async () => {
      const { selectCustomerById } = await import('./customersSlice');
      const mockState = { customers: INITIAL_STATE };
      expect(selectCustomerById(mockState, 'unknown')).toBeUndefined();
    });
  });
});
