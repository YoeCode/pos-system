import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductDetailPanel from './ProductDetailPanel';
import productsReducer, { selectProduct } from './productsSlice';
import settingsReducer from '../settings/settingsSlice';
import employeesReducer from '../employees/employeesSlice';
import { I18nProvider } from '../../i18n/I18nProvider';
import { ToastProvider } from '../../components/ToastProvider';
import { updateProduct } from './productsService';
import type { Product } from '../../types';

vi.mock('../../supabase/client', () => ({
  supabase: { from: vi.fn() },
  isSupabaseConfigured: vi.fn(() => false),
}));

vi.mock('./productsService', () => ({
  fetchProducts: vi.fn().mockResolvedValue([]),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn().mockResolvedValue(true),
  reduceStock: vi.fn().mockResolvedValue(true),
  restoreStock: vi.fn().mockResolvedValue(true),
  nextSku: vi.fn().mockResolvedValue('GEN-1'),
  fetchProductAttributes: vi.fn().mockResolvedValue([]),
  createProductAttribute: vi.fn(),
  updateProductAttribute: vi.fn(),
  deleteProductAttribute: vi.fn(),
  fetchProductVariants: vi.fn().mockResolvedValue([]),
  createProductVariant: vi.fn(),
  updateProductVariant: vi.fn(),
  deleteProductVariant: vi.fn(),
}));

const updateProductMock = vi.mocked(updateProduct);

const defaultSettings = settingsReducer(undefined, { type: '@@INIT' });

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
      settings: settingsReducer,
      employees: employeesReducer,
      auth: mockAuthReducer,
    },
    preloadedState: {
      settings: { ...defaultSettings, language: { language: 'en' as const } },
    },
  });
}

function makeProduct(overrides: Partial<Product> = {}): Product {
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
    ...overrides,
  };
}

function renderPanel(product: Product) {
  const store = createTestStore();
  store.dispatch(selectProduct(product));
  render(
    <Provider store={store}>
      <I18nProvider>
        <ToastProvider>
          <ProductDetailPanel />
        </ToastProvider>
      </I18nProvider>
    </Provider>
  );
  return store;
}

beforeEach(() => {
  updateProductMock.mockReset();
  updateProductMock.mockImplementation(product => Promise.resolve(product));
});

describe('ProductDetailPanel — plain product stock editing', () => {
  it('saves edited stock and min_stock through updateProduct from the unified stock editor', async () => {
    const user = userEvent.setup();
    renderPanel(makeProduct({ stock: 12, minStock: 2 }));

    // Open the row menu (the panel header also has an "Edit" button, hence index 1).
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(editButtons[editButtons.length - 1]);

    const stockInput = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stockInput);
    await user.type(stockInput, '25');

    const minStockInput = screen.getByRole('spinbutton', { name: 'Min. Stock' });
    await user.clear(minStockInput);
    await user.type(minStockInput, '4');

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(updateProductMock).toHaveBeenCalled());
    expect(updateProductMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', stock: 25, minStock: 4 }),
      'test-tenant'
    );
  });
});
