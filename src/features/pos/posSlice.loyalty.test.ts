import { describe, it, expect } from 'vitest';
import posReducer, { setSelectedCustomer, startNewSale, clearCart, addToCart } from './posSlice';
import type { Product } from '../../types';

const MOCK_PRODUCT: Product = {
  id: 'p1',
  name: 'Test Product',
  sku: 'SKU-001',
  category: 'General',
  price: 10,
  costPrice: 5,
  stock: 100,
  minStock: 5,
  status: 'active',
  publishedOnline: false,
};

const INITIAL_STATE = posReducer(undefined, { type: '@@INIT' });

describe('posSlice — loyalty additions', () => {
  // ── RF-02 selectedCustomerId ───────────────────────────────────────────────

  describe('setSelectedCustomer', () => {
    it('sets selectedCustomerId', () => {
      const state = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      expect(state.selectedCustomerId).toBe('cust-001');
    });

    it('clears selectedCustomerId when null is dispatched — RF-02-B', () => {
      const withCustomer = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      const cleared = posReducer(withCustomer, setSelectedCustomer(null));
      expect(cleared.selectedCustomerId).toBeNull();
    });

    it('initial selectedCustomerId is null', () => {
      expect(INITIAL_STATE.selectedCustomerId).toBeNull();
    });
  });

  describe('clearCart — RF-02-C', () => {
    it('clears cart items but does NOT reset selectedCustomerId', () => {
      const withCustomer = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      const withItem = posReducer(withCustomer, addToCart({ product: MOCK_PRODUCT }));
      const cleared = posReducer(withItem, clearCart());
      expect(cleared.cart).toHaveLength(0);
      expect(cleared.selectedCustomerId).toBe('cust-001');
    });
  });

  describe('startNewSale — RF-02-D', () => {
    it('resets cart AND selectedCustomerId to null', () => {
      let state = posReducer(INITIAL_STATE, setSelectedCustomer('cust-002'));
      state = posReducer(state, addToCart({ product: MOCK_PRODUCT }));
      expect(state.cart).toHaveLength(1);
      expect(state.selectedCustomerId).toBe('cust-002');

      const reset = posReducer(state, startNewSale());
      expect(reset.cart).toHaveLength(0);
      expect(reset.selectedCustomerId).toBeNull();
    });

    it('startNewSale on empty cart also clears selectedCustomerId', () => {
      const withCustomer = posReducer(INITIAL_STATE, setSelectedCustomer('cust-003'));
      const reset = posReducer(withCustomer, startNewSale());
      expect(reset.selectedCustomerId).toBeNull();
      expect(reset.cart).toHaveLength(0);
    });
  });
});
