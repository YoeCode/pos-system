import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { supabase } from '../../supabase/client';
import type { Product } from '../../types';
import productsReducer, { addProduct, reduceStockAsync, restoreStockAsync } from './productsSlice';

// Regression tests for issue #39: stock mutations run through the
// SECURITY DEFINER RPCs (migration 024), and when the RPC fails the thunk
// rejects instead of pretending the stock changed. A rejected thunk must not
// leave optimistic stock drift behind in the slice.
vi.mock('../../supabase/client', () => ({
  supabase: { rpc: vi.fn() },
}));

const rpc = vi.mocked((supabase as any).rpc);

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const VARIANT_ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

function makeProduct(): Product {
  return {
    id: PRODUCT_ID,
    name: 'T-Shirt',
    sku: 'TS-001',
    category: 'Ropa',
    price: 10,
    costPrice: 4,
    stock: 10,
    minStock: 2,
    status: 'active',
    publishedOnline: false,
    hasVariants: false,
    variantAttributes: [],
  };
}

function createTestStore() {
  return configureStore({
    reducer: {
      products: productsReducer,
      auth: (state = { user: { id: 'emp-1', tenantId: TENANT_ID, name: 'Cashier' } }) => state,
    },
  });
}

beforeEach(() => {
  rpc.mockReset();
});

describe('reduceStockAsync', () => {
  it('rejects and leaves stock untouched when the stock RPC fails', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    const store = createTestStore();
    store.dispatch(addProduct(makeProduct()));

    await expect(
      store.dispatch(reduceStockAsync({ productId: PRODUCT_ID, quantity: 3 })).unwrap()
    ).rejects.toThrow('Failed to reduce stock');

    expect(rpc).toHaveBeenCalledWith('reduce_stock', expect.objectContaining({ p_quantity: 3 }));
    expect(store.getState().products.items[0].stock).toBe(10);
  });

  it('fulfills and mirrors the stock change when the RPC succeeds', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const store = createTestStore();
    store.dispatch(addProduct(makeProduct()));

    await store.dispatch(reduceStockAsync({ productId: PRODUCT_ID, quantity: 3 })).unwrap();

    expect(store.getState().products.items[0].stock).toBe(7);
  });
});

describe('restoreStockAsync', () => {
  it('rejects and leaves stock untouched when the stock RPC fails', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const store = createTestStore();
    store.dispatch(addProduct(makeProduct()));

    await expect(
      store.dispatch(restoreStockAsync({ productId: PRODUCT_ID, quantity: 2 })).unwrap()
    ).rejects.toThrow('Failed to restore stock');

    expect(rpc).toHaveBeenCalledWith('restore_stock', expect.objectContaining({ p_quantity: 2 }));
    expect(store.getState().products.items[0].stock).toBe(10);
  });

  it('fulfills and mirrors the variant stock change when the RPC succeeds', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const store = createTestStore();
    const product = makeProduct();
    product.hasVariants = true;
    product.variants = [
      {
        id: VARIANT_ID,
        productId: PRODUCT_ID,
        sku: 'TS-001-S',
        price: null,
        costPrice: null,
        stock: 2,
        minStock: 1,
        image: null,
        attributes: { Talla: 'S' },
        status: 'active',
      },
    ];
    store.dispatch(addProduct(product));

    await store.dispatch(
      restoreStockAsync({ productId: PRODUCT_ID, quantity: 1, variantId: VARIANT_ID })
    ).unwrap();

    const updated = store.getState().products.items[0];
    expect(updated.variants?.[0].stock).toBe(3);
    expect(updated.stock).toBe(3);
  });
});
