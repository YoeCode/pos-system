import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Cart from './Cart';
import posReducer, { addToCart, setPointsToRedeem } from './posSlice';
import productsReducer from '../products/productsSlice';
import settingsReducer from '../settings/settingsSlice';
import customersReducer from '../customers/customersSlice';
import salesReducer from '../sales/salesSlice';
import { I18nProvider } from '../../i18n/I18nProvider';
import type { Product } from '../../types';

vi.mock('./checkout/CheckoutModal', () => ({ default: () => null }));
vi.mock('./DiscountModal', () => ({ default: () => null }));
vi.mock('../customers/CustomerSelector', () => ({ default: () => null }));
vi.mock('../../components/useToast', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

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
  hasVariants: false,
  variantAttributes: [],
};

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
      pos: posReducer,
      products: productsReducer,
      settings: settingsReducer,
      customers: customersReducer,
      sales: salesReducer,
      auth: mockAuthReducer,
    },
    preloadedState: {
      settings: { ...defaultSettings, language: { language: 'en' as const } },
    },
  });
}

function renderCart() {
  const store = createTestStore();
  const result = render(
    <Provider store={store}>
      <I18nProvider>
        <Cart />
      </I18nProvider>
    </Provider>
  );
  return { ...result, store };
}

describe('Cart — redeemed points row', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the redeemed points row once points are applied while mounted', () => {
    const { store } = renderCart();
    act(() => {
      store.dispatch(addToCart({ product: MOCK_PRODUCT }));
      store.dispatch(setPointsToRedeem(50));
    });

    expect(screen.getByText('Points (50)')).toBeInTheDocument();
    expect(screen.getByText('-€0.50')).toBeInTheDocument();
  });

  it('does not render the points row when nothing is redeemed', () => {
    const { store } = renderCart();
    act(() => {
      store.dispatch(addToCart({ product: MOCK_PRODUCT }));
    });

    expect(screen.queryByText(/Points \(/)).toBeNull();
  });
});
