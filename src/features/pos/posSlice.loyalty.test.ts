import { describe, it, expect } from 'vitest';
import posReducer, { setSelectedCustomer, startNewSale, clearCart, addToCart, setPointsToRedeem } from './posSlice';
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

const getActiveWindow = (state: ReturnType<typeof posReducer>) => {
  const windowId = state.activeWindowId;
  return state.windows.find(w => w.id === windowId);
};

const INITIAL_STATE = posReducer(undefined, { type: '@@INIT' });

describe('posSlice — loyalty additions', () => {
  describe('setSelectedCustomer', () => {
    it('sets selectedCustomerId on active window', () => {
      const state = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      const window = getActiveWindow(state);
      expect(window?.selectedCustomerId).toBe('cust-001');
    });

    it('clears selectedCustomerId when null is dispatched', () => {
      const withCustomer = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      const cleared = posReducer(withCustomer, setSelectedCustomer(null));
      const window = getActiveWindow(cleared);
      expect(window?.selectedCustomerId).toBeNull();
    });

    it('initial selectedCustomerId is null on active window', () => {
      const window = getActiveWindow(INITIAL_STATE);
      expect(window?.selectedCustomerId).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('clears cart items but does NOT reset selectedCustomerId', () => {
      const withCustomer = posReducer(INITIAL_STATE, setSelectedCustomer('cust-001'));
      const withItem = posReducer(withCustomer, addToCart({ product: MOCK_PRODUCT }));
      const cleared = posReducer(withItem, clearCart());
      const window = getActiveWindow(cleared);
      expect(window?.cart).toHaveLength(0);
      expect(window?.selectedCustomerId).toBe('cust-001');
    });

    it('clears pointsToRedeem on clearCart', () => {
      let state = posReducer(INITIAL_STATE, addToCart({ product: MOCK_PRODUCT }));
      state = posReducer(state, setPointsToRedeem(50));
      const cleared = posReducer(state, clearCart());
      const clearedWindow = getActiveWindow(cleared);
      expect(clearedWindow?.pointsToRedeem).toBe(0);
    });
  });

  describe('startNewSale', () => {
    it('resets cart AND selectedCustomerId to null', () => {
      let state = posReducer(INITIAL_STATE, setSelectedCustomer('cust-002'));
      state = posReducer(state, addToCart({ product: MOCK_PRODUCT }));
      const window = getActiveWindow(state);
      expect(window?.cart).toHaveLength(1);
      expect(window?.selectedCustomerId).toBe('cust-002');

      const reset = posReducer(state, startNewSale());
      const resetWindow = getActiveWindow(reset);
      expect(resetWindow?.cart).toHaveLength(0);
      expect(resetWindow?.selectedCustomerId).toBeNull();
    });

    it('startNewSale clears pointsToRedeem', () => {
      let state = posReducer(INITIAL_STATE, setSelectedCustomer('cust-003'));
      state = posReducer(state, setPointsToRedeem(100));
      const reset = posReducer(state, startNewSale());
      const resetWindow = getActiveWindow(reset);
      expect(resetWindow?.pointsToRedeem).toBe(0);
      expect(resetWindow?.selectedCustomerId).toBeNull();
    });
  });
});
