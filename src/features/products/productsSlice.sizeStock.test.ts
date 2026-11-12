import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer, { fetchProductsAsync, selectProduct, updateProductSizeAsync } from './productsSlice';
import { updateProductSize } from './productsService';
import type { Product } from '../../types';

vi.mock('./productsService', () => ({
  updateProduct: vi.fn().mockResolvedValue(null),
  updateProductSize: vi.fn(),
}));

const updateProductSizeMock = vi.mocked(updateProductSize);

function makeSizedProduct(): Product {
  return {
    id: 'p1',
    name: 'Tee',
    sku: 'TEE-1',
    category: 'Apparel',
    price: 20,
    costPrice: 10,
    stock: 12,
    minStock: 2,
    status: 'active',
    publishedOnline: false,
    hasVariants: false,
    variantAttributes: [],
    sizes: [
      { size: 'S', stock: 5, minStock: 1 },
      { size: 'M', stock: 7, minStock: 1 },
    ],
  };
}

const mockAuthReducer = (state = {
  user: { id: 'u1', tenantId: 'test-tenant', name: 'Test', email: 'test@test.com', role: 'admin' as const, pin: '1234' },
  isAuthenticated: true,
  error: null as string | null,
  isLoading: false,
}) => state;

function createTestStore() {
  return configureStore({
    reducer: {
      products: productsReducer,
      auth: mockAuthReducer,
    },
  });
}

beforeEach(() => {
  updateProductSizeMock.mockReset();
});

describe('updateProductSizeAsync — aggregate stock recompute', () => {
  it('recomputes the aggregate product stock on fulfilled (items and selectedProduct)', () => {
    let state = productsReducer(undefined, { type: '@@INIT' });
    state = productsReducer(state, fetchProductsAsync.fulfilled([makeSizedProduct()], 'r1', undefined));
    state = productsReducer(state, selectProduct(makeSizedProduct()));

    const arg = { productId: 'p1', size: { size: 'M', stock: 3, minStock: 1 } };
    const action = updateProductSizeAsync.fulfilled(
      { productId: 'p1', size: { size: 'M', stock: 3, minStock: 1, sku: undefined } },
      'r2',
      arg
    );
    state = productsReducer(state, action);

    expect(state.items[0].sizes?.find(s => s.size === 'M')?.stock).toBe(3);
    expect(state.items[0].stock).toBe(8);
    expect(state.selectedProduct?.sizes?.find(s => s.size === 'M')?.stock).toBe(3);
    expect(state.selectedProduct?.stock).toBe(8);
  });
});

describe('updateProductSizeAsync — thunk', () => {
  it('persists the targeted product_sizes row through the service', async () => {
    updateProductSizeMock.mockResolvedValue({ size: 'M', stock: 3, minStock: 1, sku: undefined });
    const store = createTestStore();
    store.dispatch(fetchProductsAsync.fulfilled([makeSizedProduct()], 'r1', undefined));

    await store.dispatch(
      updateProductSizeAsync({ productId: 'p1', size: { size: 'M', stock: 3, minStock: 1 } })
    ).unwrap();

    expect(updateProductSizeMock).toHaveBeenCalledWith(
      'p1',
      'M',
      { stock: 3, minStock: 1 },
      'test-tenant'
    );
    expect(store.getState().products.items[0].stock).toBe(8);
  });

  it('rejects (no silent success) when the service reports failure', async () => {
    updateProductSizeMock.mockResolvedValue(null);
    const store = createTestStore();
    store.dispatch(fetchProductsAsync.fulfilled([makeSizedProduct()], 'r1', undefined));

    await expect(
      store.dispatch(
        updateProductSizeAsync({ productId: 'p1', size: { size: 'M', stock: 3, minStock: 1 } })
      ).unwrap()
    ).rejects.toThrow('Failed to update product size');

    expect(store.getState().products.items[0].stock).toBe(12);
  });
});
